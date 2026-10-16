import { books } from '@/mocks/books'
import type { Book } from '@/types/book'
import type { LibraryEntry } from '@/types/library'

/** Books sharing the most moods + tropes, excluding this one and anything already Read */
export function similarBooks(book: Book, entries: Record<string, LibraryEntry>, limit = 6): Book[] {
  return books
    .filter((b) => b.id !== book.id && entries[b.id]?.status !== 'read')
    .map((b) => ({
      book: b,
      score:
        b.moods.filter((m) => book.moods.includes(m)).length + b.tropes.filter((t) => book.tropes.includes(t)).length,
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ book }) => book)
}
