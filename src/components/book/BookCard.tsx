import { Link } from 'react-router'
import type { Book } from '@/types/book'
import { useLogSheet } from '@/components/log-sheet/context'
import { useLibraryEntry } from '@/state/library'
import { useShelfActions } from '@/state/useShelfActions'
import { cn } from '@/lib/utils'
import { BookCover } from './BookCover'
import { StarRating } from './StarRating'
import { StatusChip, type LogRequest } from './StatusChip'

type BookCardProps = {
  book: Book
  /**
   * default: cover + chip + title/author (carousels)
   * grid:    cover + chip + stars only (Library)
   * row:     small cover + text + chip on the right (Search)
   */
  variant?: 'default' | 'grid' | 'row'
  /** Defaults to opening the LogSheet */
  onRequestLog?: LogRequest
  className?: string
}

/*
 * Accessibility: the card has ONE link (the title, stretched over the card with ::after)
 * so cover and title both navigate. The StatusChip is a sibling button raised above the
 * link with z-10; interactive elements are never nested.
 */
const stretchedLink =
  "outline-none after:absolute after:inset-0 after:z-0 after:rounded-lg after:content-[''] focus-visible:after:ring-3 focus-visible:after:ring-ring/50"

export function BookCard({ book, variant = 'default', onRequestLog, className }: BookCardProps) {
  const entry = useLibraryEntry(book.id)
  const changeStatus = useShelfActions()
  const logSheet = useLogSheet()
  const href = `/book/${book.id}`

  const chip = (
    <StatusChip
      bookId={book.id}
      bookTitle={book.title}
      status={entry.status}
      onStatusChange={(status) => changeStatus(book.id, status)}
      onRequestLog={
        onRequestLog ?? ((bookId, intent, trigger) => logSheet.open(bookId, { intent, returnFocus: trigger }))
      }
      // Carousels and grids: the chip can never be wider than the cover
      variant={variant === 'row' ? 'chip' : 'compact'}
      isPublished={book.isPublished}
      className="relative z-10 shrink-0"
    />
  )

  if (variant === 'row') {
    return (
      <article className={cn('relative flex items-center gap-3 py-2', className)}>
        <BookCover book={book} size="sm" />
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-sm leading-snug font-semibold">
            <Link to={href} className={stretchedLink}>
              {book.title}
            </Link>
          </h3>
          <p className="truncate text-xs text-muted-foreground">{book.author}</p>
          {book.series && (
            <p className="truncate text-xs text-muted-foreground">
              {book.series} #{book.seriesNumber}
            </p>
          )}
        </div>
        {chip}
      </article>
    )
  }

  if (variant === 'grid') {
    return (
      <article className={cn('relative flex flex-col', className)}>
        <div className="relative">
          <BookCover book={book} className="w-full" reserveBottom />
          <div className="absolute inset-x-0 -bottom-4 flex justify-center">{chip}</div>
        </div>
        {/* Title isn't visible in the grid, but the link still needs a name */}
        <Link to={href} className={stretchedLink}>
          <span className="sr-only">
            {book.title} by {book.author}
          </span>
        </Link>
        <div className="mt-6 flex h-4 justify-center">
          {entry.rating !== null && <StarRating value={entry.rating} size="sm" />}
        </div>
      </article>
    )
  }

  return (
    <article className={cn('relative flex w-26 flex-col', className)}>
      <div className="relative">
        <BookCover book={book} size="md" reserveBottom />
        <div className="absolute inset-x-0 -bottom-4 flex justify-center">{chip}</div>
      </div>
      <h3 className="mt-6 line-clamp-2 text-sm leading-snug font-semibold">
        <Link to={href} className={stretchedLink}>
          {book.title}
        </Link>
      </h3>
      <p className="truncate text-xs text-muted-foreground">{book.author}</p>
    </article>
  )
}
