import { describe, expect, it } from 'vitest'
import { books } from '@/mocks/books'
import {
  activeFilters,
  EMPTY_FILTERS,
  filterBooks,
  filtersFromParams,
  filtersToParams,
  lengthOf,
  matchSummary,
  type Filters,
} from './filters'

const f = (partial: Partial<Filters>): Filters => ({ ...EMPTY_FILTERS, ...partial })
const ids = (filters: Filters) => filterBooks(books, filters).map((b) => b.id)

describe('filters', () => {
  it('combines values in a group with OR', () => {
    const funny = ids(f({ moods: ['funny'] }))
    const hopeful = ids(f({ moods: ['hopeful'] }))
    const either = ids(f({ moods: ['funny', 'hopeful'] }))
    expect(new Set(either)).toEqual(new Set([...funny, ...hopeful]))
    expect(either.length).toBeGreaterThan(Math.max(funny.length, hopeful.length))
  })

  it('combines groups with AND', () => {
    const result = filterBooks(books, f({ moods: ['dark'], pace: ['fast'], tropes: ['enemies to lovers'] }))
    expect(result.map((b) => b.id)).toEqual(['fourth-wing'])
    for (const b of result) {
      expect(b.moods).toContain('dark')
      expect(b.pace).toBe('fast')
      expect(b.tropes).toContain('enemies to lovers')
    }
  })

  it('filters by length buckets', () => {
    expect(lengthOf(299)).toBe('short')
    expect(lengthOf(300)).toBe('medium')
    expect(lengthOf(450)).toBe('medium')
    expect(lengthOf(451)).toBe('long')
    for (const b of filterBooks(books, f({ length: ['long'] }))) expect(b.pages).toBeGreaterThan(450)
    for (const b of filterBooks(books, f({ length: ['short', 'medium'] }))) expect(b.pages).toBeLessThanOrEqual(450)
  })

  it('excludes books with a hidden content warning', () => {
    const scifi = ids(f({ genres: ['Science Fiction'] }))
    const safe = ids(f({ genres: ['Science Fiction'], exclude: ['violence'] }))
    expect(safe).toEqual(['project-hail-mary', 'the-martian'])
    expect(scifi.length).toBeGreaterThan(safe.length)
  })

  it('round-trips through the URL, keeping order and dropping junk', () => {
    const filters = f({ moods: ['dark', 'tense'], pace: ['fast'], tropes: ['enemies to lovers'], length: ['long'], exclude: ['violence'] })
    const params = filtersToParams(filters)
    expect(params.toString()).toBe('mood=dark&mood=tense&pace=fast&trope=enemies+to+lovers&length=long&exclude=violence')
    expect(filtersFromParams(new URLSearchParams(params.toString()))).toEqual(filters)

    const messy = new URLSearchParams('pace=warp&mood=dark&mood=dark&length=epic&utm=x&genre=Thriller')
    expect(filtersFromParams(messy)).toEqual(f({ moods: ['dark'], genres: ['Thriller'] }))
  })

  it('lists active filters in URL order and explains matches', () => {
    const params = new URLSearchParams('pace=fast&mood=dark&exclude=violence')
    expect(activeFilters(params).map((a) => a.label)).toEqual(['Fast', 'Dark', 'No violence'])
    const fw = books.find((b) => b.id === 'fourth-wing')!
    expect(matchSummary(fw, f({ moods: ['dark'], pace: ['fast'], tropes: ['enemies to lovers'] }))).toBe('Dark · Fast · Enemies to lovers')
  })
})
