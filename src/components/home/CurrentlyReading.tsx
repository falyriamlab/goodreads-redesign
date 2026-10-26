import { useId } from 'react'
import { Link } from 'react-router'
import { BookCover } from '@/components/book/BookCover'
import { UpdateProgress } from '@/components/book/UpdateProgress'
import { ProgressBar } from '@/components/common/ProgressBar'
import { SectionHeader } from '@/components/common/SectionHeader'
import { useLogSheet } from '@/components/log-sheet/context'
import { Button } from '@/components/ui/button'
import { readingProgress } from '@/lib/readingProgress'
import { textLinkClass } from '@/lib/ui'
import type { Book } from '@/types/book'
import type { useHomeData } from './useHomeData'

type Reading = ReturnType<typeof useHomeData>['reading']

/** Display-number place #1 on Home (the carousel counts as one place) */
export function CurrentlyReading({ reading }: { reading: Reading }) {
  const id = useId()
  return (
    <section aria-labelledby={id} className="space-y-4">
      <SectionHeader id={id} kicker="On your nightstand" title="Now reading" className="px-4" />
      {reading.length === 0 ? (
        <div className="mx-4 space-y-1 rounded-xl border border-dashed border-muted-foreground p-4">
          <p className="text-sm text-muted-foreground">Nothing on the go right now.</p>
          <Link to="/discover" className={textLinkClass}>
            Find your next read
          </Link>
        </div>
      ) : (
        // Scroll-snap carousel, no autoplay: the next card peeks in at 88%
        <ul className="flex snap-x snap-mandatory scroll-px-4 gap-4 relative overflow-x-auto px-4 pb-2">
          {reading.map(({ book, currentPage }) => (
            <li key={book.id} className={reading.length > 1 ? 'w-[88%] shrink-0 snap-start' : 'w-full'}>
              <ReadingCard book={book} currentPage={currentPage} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function ReadingCard({ book, currentPage }: { book: Book; currentPage: number }) {
  const logSheet = useLogSheet()
  const p = readingProgress(book, currentPage)
  return (
    // relative: contains the sr-only span, which would otherwise escape the carousel and widen the page
    <article className="relative h-full space-y-4 rounded-2xl border border-border bg-card p-4 text-card-foreground">
      <div className="flex gap-4">
        <BookCover book={book} className="w-24" />
        <div className="min-w-0 flex-1">
          <h3 className="book-title">
            <Link
              to={`/book/${book.id}`}
              className="inline-flex min-h-11 items-center outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <span className="line-clamp-2">{book.title}</span>
            </Link>
          </h3>
          <p className="truncate text-sm text-muted-foreground">{book.author}</p>
          <p className="mt-2 flex items-baseline gap-1">
            <span className="stat-number">{p.percent}</span>
            <span className="stat-unit text-muted-foreground">%</span>
            <span className="sr-only"> read</span>
          </p>
          <p className="text-xs text-muted-foreground">{p.detail}</p>
        </div>
      </div>
      <ProgressBar percent={p.percent} label={`Progress in ${book.title}`} valueText={p.detail} />
      <div className="flex gap-2">
        <UpdateProgress book={book} currentPage={currentPage} className="flex-1 px-2" />
        <Button className="min-h-11 flex-1 px-2" onClick={(e) => logSheet.open(book.id, { intent: 'read', returnFocus: e.currentTarget })}>
          Finished it
        </Button>
      </div>
    </article>
  )
}
