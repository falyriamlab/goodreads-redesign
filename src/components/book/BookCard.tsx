import type { ReactNode } from 'react'
import { X } from 'lucide-react'
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
  /** Adds a "Not my vibe" button over the cover (default variant only) */
  onDismiss?: () => void
  /** Replaces the plain title/author text, e.g. with <mark> highlights (search) */
  titleContent?: ReactNode
  authorContent?: ReactNode
  /** Small line under the card, e.g. why it matched the filters */
  caption?: string
  /** Called when the book link is followed (e.g. save a recent search) */
  onOpen?: () => void
  className?: string
}

/*
 * Accessibility: the card has ONE link (the title, stretched over the card with ::after)
 * so cover and title both navigate. The StatusChip is a sibling button raised above the
 * link with z-10; interactive elements are never nested.
 */
const stretchedLink =
  "outline-none after:absolute after:inset-0 after:z-0 after:rounded-lg after:content-[''] focus-visible:after:ring-3 focus-visible:after:ring-ring/50"

export function BookCard({
  book,
  variant = 'default',
  onRequestLog,
  onDismiss,
  titleContent,
  authorContent,
  caption,
  onOpen,
  className,
}: BookCardProps) {
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
            <Link to={href} onClick={onOpen} className={stretchedLink}>
              {titleContent ?? book.title}
            </Link>
          </h3>
          <p className="truncate text-xs text-muted-foreground">{authorContent ?? book.author}</p>
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
        <Link to={href} onClick={onOpen} className={stretchedLink}>
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
        {onDismiss && (
          // Sibling of the stretched link, raised above it: 44px hit area, smaller visual circle
          <button
            type="button"
            aria-label={`Not my vibe: hide ${book.title}`}
            onClick={onDismiss}
            className="group/dismiss absolute -top-5 -right-5 z-10 flex size-11 items-center justify-center rounded-full outline-none"
          >
            <span className="flex size-7 items-center justify-center rounded-full border border-muted-foreground bg-background text-foreground shadow-sm transition-colors group-hover/dismiss:bg-muted group-focus-visible/dismiss:ring-3 group-focus-visible/dismiss:ring-ring/50">
              <X className="size-4" strokeWidth={2.5} aria-hidden="true" />
            </span>
          </button>
        )}
      </div>
      <h3 className="mt-6 line-clamp-2 text-sm leading-snug font-semibold">
        <Link to={href} onClick={onOpen} className={stretchedLink}>
          {titleContent ?? book.title}
        </Link>
      </h3>
      <p className="truncate text-xs text-muted-foreground">{authorContent ?? book.author}</p>
      {caption && <p className="mt-1 line-clamp-2 text-xs leading-snug">{caption}</p>}
    </article>
  )
}
