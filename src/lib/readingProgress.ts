import { chapterFromPage } from '@/lib/community'
import type { Book } from '@/types/book'

export const stretchedLink =
  "outline-none after:absolute after:inset-0 after:z-0 after:content-[''] focus-visible:after:ring-2 focus-visible:after:ring-ring"

/** Reading progress for a book: percent, page and (when the chapter count is known) chapter */
export function readingProgress(book: Book, currentPage: number) {
  const percent = Math.min(100, Math.round((currentPage / book.pages) * 100))
  const chapter = book.chapterCount ? chapterFromPage(currentPage, book.pages, book.chapterCount) : null
  return { percent, chapter, detail: `p. ${currentPage} of ${book.pages}${chapter ? ` · Ch. ${chapter}` : ''}` }
}
