import { useId } from 'react'
import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router'
import { BookCover } from '@/components/book/BookCover'
import { buddyReaderCount, currentChapter, spanLabel } from '@/lib/community'
import { getBookById } from '@/mocks/books'
import { buddyReads } from '@/mocks/community'
import { useLibrary } from '@/state/library'
import type { Book } from '@/types/book'

/** Buddy reads you've joined; hidden entirely when there are none */
export function BuddyReads() {
  const headingId = useId()
  const joined = useLibrary((s) => s.joinedBuddyReads)
  const entries = useLibrary((s) => s.entries)
  const mine = buddyReads.filter((br) => joined.includes(br.id))
  if (mine.length === 0) return null

  return (
    <section aria-labelledby={headingId} className="space-y-3 px-4">
      <h2 id={headingId} className="text-lg font-bold tracking-tight">
        Your buddy reads
      </h2>
      <ul className="space-y-2">
        {mine.map((br) => {
          const book = getBookById(br.bookId) as Book
          return (
            <li key={br.id}>
              <Link
                to={`/community/buddy/${br.id}`}
                className="flex min-h-14 items-center gap-3 rounded-lg border border-border p-2 pr-3 outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <BookCover book={book} size="sm" className="w-10" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{book.title}</span>
                  <span className="block text-xs text-muted-foreground">
                    {spanLabel(br.currentSpan)} · {buddyReaderCount(br, true)} readers · You're on Ch.{' '}
                    {currentChapter(book, entries[book.id])}
                  </span>
                </span>
                <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
