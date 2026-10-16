import { useState } from 'react'
import { Heart } from 'lucide-react'
import { Link } from 'react-router'
import { BookCover } from '@/components/book/BookCover'
import { StarRating } from '@/components/book/StarRating'
import { TopBar } from '@/components/layout/TopBar'
import { Badge } from '@/components/ui/badge'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { groupByMonth, monthSummary } from '@/lib/journal'
import { getBookById } from '@/mocks/books'
import { useLibrary } from '@/state/library'
import type { Book } from '@/types/book'
import type { ReadingEvent } from '@/types/library'

type Filter = 'all' | 'finished' | 'started' | 'dnf'

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'finished', label: 'Finished' },
  { value: 'started', label: 'Started' },
  { value: 'dnf', label: 'DNF' },
]

const toggleOnClass =
  'min-h-11 min-w-11 border-muted-foreground px-3 font-medium data-[state=on]:border-foreground data-[state=on]:bg-foreground data-[state=on]:font-semibold data-[state=on]:text-background'

export function JournalPage() {
  const history = useLibrary((s) => s.history)
  const [filter, setFilter] = useState<Filter>('all')
  const events = filter === 'all' ? history : history.filter((e) => e.type === filter)
  const months = groupByMonth(events)

  return (
    <>
      <TopBar title="Journal" back backFallback="/library" />
      <div className="space-y-6 px-4 pt-3 pb-8">
        {history.length === 0 ? (
          <div className="space-y-1 rounded-xl border border-dashed border-muted-foreground p-4">
            <p className="font-semibold">Your journal is empty.</p>
            <p className="text-sm text-muted-foreground">Log a book and it shows up here.</p>
          </div>
        ) : (
          <>
            <ToggleGroup
              type="single"
              variant="outline"
              aria-label="Show"
              value={filter}
              // Single select that can't be emptied: ignore deselecting the active item
              onValueChange={(v) => v && setFilter(v as Filter)}
              className="flex w-full flex-wrap"
            >
              {FILTERS.map((f) => (
                <ToggleGroupItem key={f.value} value={f.value} className={toggleOnClass}>
                  {f.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>

            {months.length === 0 && (
              <p className="text-sm text-muted-foreground">Nothing here yet for this filter.</p>
            )}

            {months.map((month) => (
              <section key={month.key} aria-labelledby={`month-${month.key}`} className="space-y-2">
                <div className="flex items-baseline justify-between gap-3 border-b border-border pb-1">
                  <h2 id={`month-${month.key}`} className="text-lg font-bold tracking-tight">
                    {month.label}
                  </h2>
                  <p className="text-sm text-muted-foreground">{monthSummary(month)}</p>
                </div>
                <ul className="divide-y divide-border">
                  {month.events.map((event) => {
                    const book = getBookById(event.bookId)
                    return book ? (
                      <li key={event.id}>
                        <JournalEntry event={event} book={book} />
                      </li>
                    ) : null
                  })}
                </ul>
              </section>
            ))}
          </>
        )}
      </div>
    </>
  )
}

function typeLabel(event: ReadingEvent): string {
  if (event.type === 'finished') return 'Finished'
  if (event.type === 'started') return 'Started'
  return event.dnfPage ? `DNF at p. ${event.dnfPage}` : 'DNF'
}

/** The whole entry is one link to the book */
function JournalEntry({ event, book }: { event: ReadingEvent; book: Book }) {
  const loved = useLibrary((s) => s.entries[book.id]?.loved ?? false)
  const date = new Date(`${event.date}T00:00:00`)

  return (
    <Link
      to={`/book/${book.id}`}
      className="flex min-h-14 items-center gap-3 rounded-lg py-2 outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <time dateTime={event.date} className="flex w-9 shrink-0 flex-col items-center leading-none">
        <span className="text-lg font-bold tabular-nums">{date.getDate()}</span>
        <span className="text-xs text-muted-foreground">{date.toLocaleDateString('en-US', { weekday: 'short' })}</span>
      </time>
      <BookCover book={book} size="sm" />
      <span className="min-w-0 flex-1 space-y-0.5">
        <span className="block line-clamp-2 text-sm leading-snug font-semibold">{book.title}</span>
        <span className="block text-xs">{typeLabel(event)}</span>
        <span className="flex flex-wrap items-center gap-2">
          {event.type === 'finished' && event.rating != null && <StarRating value={event.rating} size="xs" />}
          {loved && event.type === 'finished' && (
            <span className="inline-flex items-center gap-1 text-xs font-medium">
              <Heart className="size-3.5 fill-current" aria-hidden="true" />
              Loved
            </span>
          )}
          {event.isReread && <Badge variant="outline">Reread</Badge>}
        </span>
      </span>
    </Link>
  )
}
