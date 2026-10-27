import { Heart } from 'lucide-react'
import { Link } from 'react-router'
import { BookCover } from '@/components/book/BookCover'
import { StarRating } from '@/components/book/StarRating'
import { Badge } from '@/components/ui/badge'
import type { Book } from '@/types/book'
import type { ReadingEvent } from '@/types/library'

function typeLabel(event: ReadingEvent): string {
  if (event.type === 'finished') return 'Finished'
  if (event.type === 'started') return 'Started'
  return event.dnfPage ? `DNF at p. ${event.dnfPage}` : 'DNF'
}

/** The whole entry is one link to the book */
export function JournalEntry({ event, book, loved }: { event: ReadingEvent; book: Book; loved: boolean }) {
  const date = new Date(`${event.date}T00:00:00`)

  return (
    <Link
      to={`/book/${book.id}`}
      className="flex min-h-14 items-center gap-3 rounded-lg py-2 outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <time dateTime={event.date} className="flex w-9 shrink-0 flex-col items-center leading-none">
        <span className="text-lg font-bold tabular-nums">{date.getDate()}</span>
        <span className="text-xs text-muted-foreground">{date.toLocaleDateString('en-US', { weekday: 'short' })}</span>
      </time>
      <BookCover book={book} size="sm" />
      <span className="min-w-0 flex-1 space-y-0.5">
        <span className="block line-clamp-2 book-title">{book.title}</span>
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
