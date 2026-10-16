import { useId } from 'react'
import { ChevronRight, Users } from 'lucide-react'
import { Link } from 'react-router'
import { getBookById } from '@/mocks/books'
import { buddyReads } from '@/mocks/buddyReads'
import type { Book } from '@/types/book'

/** Hidden entirely when there are no buddy reads */
export function BuddyReads() {
  const headingId = useId()
  if (buddyReads.length === 0) return null

  return (
    <section aria-labelledby={headingId} className="space-y-3 px-4">
      <h2 id={headingId} className="text-lg font-bold tracking-tight">
        Your buddy reads
      </h2>
      <ul className="space-y-2">
        {buddyReads.map((br) => {
          const book = getBookById(br.bookId) as Book
          return (
            <li key={br.id}>
              <Link
                to={`/book/${book.id}`}
                className="flex min-h-14 items-center gap-3 rounded-lg border border-border px-3 outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <Users className="size-5 shrink-0" aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">
                    {book.title} · {br.chapters}
                  </span>
                  <span className="block text-xs text-muted-foreground">{br.participants} people</span>
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
