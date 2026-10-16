import { describe, expect, it } from 'vitest'
import { books } from '@/mocks/books'
import { HISTORY_SEED, LIBRARY_SEED } from '@/state/library'
import type { ReadingEvent } from '@/types/library'
import { exportLibraryCsv } from './exportCsv'
import { matchRows, parseLibraryCsv } from './importCsv'
import { addFavorite, HANDLE_ERROR, MAX_FAVORITES, moveFavorite, normalizeFavorites, removeFavorite, validateHandle } from './profile'
import { parseShareParams, shareSearch } from './shareParams'
import { monthStats, yearStats } from './stats'

const pages = (id: string) => books.find((b) => b.id === id)!.pages
const ev = (bookId: string, type: ReadingEvent['type'], date: string, rating: number | null = null): ReadingEvent => ({
  id: `${bookId}-${date}`,
  bookId,
  type,
  date,
  rating,
  isReread: false,
})

describe('stats', () => {
  const history = [
    ev('gone-girl', 'finished', '2026-01-14', 4),
    ev('the-martian', 'finished', '2026-01-30', 4.75),
    ev('beach-read', 'finished', '2026-03-12', 3.5),
    ev('dune', 'dnf', '2026-03-20'),
    ev('babel', 'started', '2026-03-21'),
    ev('circe', 'finished', '2025-12-30', 5),
  ]
  const s = yearStats(history, 2026)

  it('counts books and pages per month, excluding DNF and other years', () => {
    expect(s.books).toBe(3)
    expect(s.booksPerMonth).toEqual([2, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0])
    expect(s.pagesPerMonth[0]).toBe(pages('gone-girl') + pages('the-martian'))
    expect(s.pages).toBe(pages('gone-girl') + pages('the-martian') + pages('beach-read'))
  })

  it('averages ratings and buckets them by half stars', () => {
    expect(s.avgRating).toBe(4.08)
    const counts = Object.fromEntries(s.ratingDistribution.map((d) => [d.bucket, d.count]))
    expect(counts).toMatchObject({ 3.5: 1, 4: 1, 4.5: 1, 5: 0 })
  })

  it('ranks top genres with percentages of finished books', () => {
    // Gone Girl: Thriller, Mystery · The Martian: Science Fiction · Beach Read: Romance, Contemporary
    expect(s.topGenres).toHaveLength(3)
    expect(s.topGenres.every((g) => g.count === 1 && g.percent === 33)).toBe(true)
    expect(s.pace).toMatchObject({ fast: { count: 1 }, medium: { count: 2 } })
  })

  it('month stats find the best-rated finish', () => {
    const jan = monthStats(history, '2026-01')
    expect(jan.books).toBe(2)
    expect(jan.topRated?.book.id).toBe('the-martian')
    expect(monthStats(history, '2026-02').books).toBe(0)
  })

  it('the seed October has 3 finishes', () => {
    const oct = monthStats(HISTORY_SEED, '2026-10')
    expect(oct.finished.map((f) => f.book.id)).toEqual(['throne-of-glass', 'the-silent-patient', 'book-lovers'])
    expect(oct.topRated?.book.id).toBe('book-lovers')
  })
})

describe('favorites', () => {
  it('caps at 4 and ignores duplicates', () => {
    let list: string[] = []
    for (const id of ['a', 'b', 'a', 'c', 'd', 'e']) list = addFavorite(list, id)
    expect(list).toEqual(['a', 'b', 'c', 'd'])
    expect(list).toHaveLength(MAX_FAVORITES)
    expect(normalizeFavorites(['x', 'x', 'y', 'z', 'w', 'v'])).toEqual(['x', 'y', 'z', 'w'])
  })

  it('reorders and removes', () => {
    expect(moveFavorite(['a', 'b', 'c', 'd'], 'd', 0)).toEqual(['d', 'a', 'b', 'c'])
    expect(moveFavorite(['a', 'b', 'c', 'd'], 'a', 9)).toEqual(['b', 'c', 'd', 'a'])
    expect(removeFavorite(['a', 'b'], 'a')).toEqual(['b'])
  })
})

describe('handle validation', () => {
  it.each(['sofiareads', 'sofi_99', 'abc'])('accepts %s', (h) => expect(validateHandle(h)).toBeNull())
  it.each(['ab', 'Sofia', 'sofía', 'sofi reads', 'sofi-reads', 'a'.repeat(21), '@sofi'])('rejects %s', (h) =>
    expect(validateHandle(h)).toBe(HANDLE_ERROR),
  )
})

describe('share params', () => {
  const now = new Date(2026, 9, 16)
  const parse = (q: string) => parseShareParams(new URLSearchParams(q), now)

  it('parses each type', () => {
    expect(parse('type=book&book=fourth-wing').target).toEqual({ type: 'book', bookId: 'fourth-wing' })
    expect(parse('type=month&month=2026-10').target).toEqual({ type: 'month', month: '2026-10' })
    expect(parse('type=year').target).toEqual({ type: 'year', year: 2026 })
    expect(parse('type=top4&style=dark')).toEqual({ target: { type: 'top4' }, style: 'dark', bookId: null })
  })

  it('falls back sensibly', () => {
    expect(parse('book=fourth-wing').target).toEqual({ type: 'book', bookId: 'fourth-wing' })
    expect(parse('type=book').target).toEqual({ type: 'month', month: '2026-10' })
    expect(parse('type=month&month=2026-13').target).toEqual({ type: 'month', month: '2026-10' })
    expect(parse('style=neon').style).toBe('brand')
  })

  it('round-trips through shareSearch', () => {
    const p = parse('type=month&month=2026-09&style=light&book=babel')
    expect(parse(shareSearch(p.target, p.style, p.bookId))).toEqual(p)
  })
})

describe('CSV export', () => {
  it('re-imports without losing status, rating or dates', () => {
    const csv = exportLibraryCsv(LIBRARY_SEED)
    const { format, rows } = parseLibraryCsv(csv)
    expect(format).toBe('goodreads')
    const { matched, unmatched } = matchRows(rows, books)
    expect(unmatched).toEqual([])
    expect(matched).toHaveLength(Object.keys(LIBRARY_SEED).length)

    for (const { row, book, by } of matched) {
      const e = LIBRARY_SEED[book.id]
      expect(by).toBe('isbn')
      expect(row.status).toBe(e.status)
      expect(row.rating).toBe(e.rating)
      expect(row.dateRead).toBe(e.status === 'read' ? e.finishedAt : null)
    }
  })
})
