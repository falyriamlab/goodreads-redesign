import { describe, expect, it } from 'vitest'
import { books } from '@/mocks/books'
import type { Book } from '@/types/book'
import { searchBooks } from './search'

const ids = (q: string) => searchBooks(q, books).results.map((r) => r.book.id)

describe('searchBooks', () => {
  it('finds Fourth Wing from "forth wing" and offers a correction', () => {
    const { results, correctedQuery } = searchBooks('forth wing', books)
    expect(results[0].book.id).toBe('fourth-wing')
    expect(correctedQuery).toBe('Fourth Wing')
  })

  it('finds Rebecca Yarros from "yaros" and corrects to the author', () => {
    const { results, correctedQuery } = searchBooks('yaros', books)
    expect(results.slice(0, 3).map((r) => r.book.author)).toEqual(['Rebecca Yarros', 'Rebecca Yarros', 'Rebecca Yarros'])
    expect(correctedQuery).toBe('Rebecca Yarros')
  })

  it('finds The Cruel Prince from "cruel prinse"', () => {
    const { results, correctedQuery } = searchBooks('cruel prinse', books)
    expect(results[0].book.id).toBe('the-cruel-prince')
    expect(correctedQuery).toBe('The Cruel Prince')
  })

  it('ignores accents and case in both directions', () => {
    const accented: Book = { ...books[0], id: 'x', title: 'Cien años de soledad', author: 'Gabriel García Márquez' }
    const catalog = [...books, accented]
    expect(searchBooks('garcia marquez', catalog).results[0].book.id).toBe('x')
    expect(searchBooks('CIEN AÑOS', catalog).results[0].book.id).toBe('x')
    // Accented query against an unaccented title
    expect(ids('circé')[0]).toBe('circe')
  })

  it('does not correct a query that literally appears', () => {
    const { results, correctedQuery } = searchBooks('wing', books)
    expect(results[0].book.id).toBe('fourth-wing')
    expect(correctedQuery).toBeNull()
  })

  it('highlights the literal match', () => {
    const [first] = searchBooks('fourth', books).results
    expect(first.highlights.title).toEqual([[0, 5]])
  })

  it('highlights whole near-miss words for typo queries', () => {
    const [first] = searchBooks('forth wing', books).results
    expect(first.highlights.title).toEqual([[0, 5], [7, 10]])
    const yarros = searchBooks('yaros', books).results[0]
    expect(yarros.highlights.author).toEqual([[8, 13]])
  })

  it('exact mode only returns literal matches', () => {
    expect(searchBooks('forth wing', books, { exact: true }).results).toEqual([])
  })
})
