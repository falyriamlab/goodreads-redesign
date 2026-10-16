import { useId } from 'react'
import { Link } from 'react-router'
import { BookCover } from '@/components/book/BookCover'
import { UpdateProgress } from '@/components/book/UpdateProgress'
import { useLogSheet } from '@/components/log-sheet/context'
import { Button } from '@/components/ui/button'
import { books } from '@/mocks/books'
import { useLibrary } from '@/state/library'
import type { Book } from '@/types/book'

export function CurrentlyReading() {
  const headingId = useId()
  const entries = useLibrary((s) => s.entries)
  const reading = books.filter((b) => entries[b.id]?.status === 'reading')

  return (
    <section aria-labelledby={headingId} className="space-y-3">
      <h2 id={headingId} className="px-4 text-lg font-bold tracking-tight">
        Currently reading
      </h2>
      {reading.length === 0 ? (
        <div className="mx-4 space-y-1 rounded-xl border border-dashed border-muted-foreground p-4">
          <p className="text-sm text-muted-foreground">Nothing on the go right now.</p>
          <Link
            to="/discover"
            className="inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            Find your next read
          </Link>
        </div>
      ) : (
        // Scroll-snap carousel, no autoplay. Cards are 85% wide so the next one peeks in.
        // Keyboard: every card has buttons, and focusing one scrolls it into view.
        <ul className="flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-2">
          {reading.map((book) => (
            <li key={book.id} className={reading.length > 1 ? 'w-[85%] shrink-0 snap-start' : 'w-full'}>
              <ReadingCard book={book} currentPage={entries[book.id].currentPage} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function ReadingCard({ book, currentPage }: { book: Book; currentPage: number }) {
  const logSheet = useLogSheet()
  const percent = Math.min(100, Math.round((currentPage / book.pages) * 100))

  return (
    <article className="flex h-full gap-3 rounded-xl border border-border bg-card p-3 text-card-foreground">
      <BookCover book={book} size="md" />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="min-w-0">
          <h3 className="leading-snug font-semibold">
            <Link
              to={`/book/${book.id}`}
              className="flex min-h-11 items-center outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <span className="line-clamp-2">{book.title}</span>
            </Link>
          </h3>
          <p className="truncate text-xs text-muted-foreground">{book.author}</p>
        </div>

        <div className="space-y-1">
          <div
            role="progressbar"
            aria-label={`Progress in ${book.title}`}
            aria-valuemin={0}
            aria-valuemax={book.pages}
            aria-valuenow={currentPage}
            aria-valuetext={`Page ${currentPage} of ${book.pages}`}
            className="h-1.5 overflow-hidden rounded-full bg-muted"
          >
            <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
          </div>
          <p aria-hidden="true" className="text-xs">
            <span className="font-semibold">p. {currentPage}</span>
            <span className="text-muted-foreground"> · {percent}%</span>
          </p>
        </div>

        <div className="mt-auto flex flex-wrap gap-2">
          <UpdateProgress book={book} currentPage={currentPage} className="flex-1 px-2" />
          <Button
            className="min-h-11 flex-1 px-2"
            onClick={(e) => logSheet.open(book.id, { intent: 'read', returnFocus: e.currentTarget })}
          >
            Finished it
          </Button>
        </div>
      </div>
    </article>
  )
}
