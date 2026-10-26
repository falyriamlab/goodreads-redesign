import { Check } from 'lucide-react'
import { BookCard } from '@/components/book/BookCard'
import { BookCover } from '@/components/book/BookCover'
import { StarRating } from '@/components/book/StarRating'
import { statusLine } from '@/lib/libraryView'
import { cn } from '@/lib/utils'
import type { Book } from '@/types/book'
import type { LibraryEntry } from '@/types/library'

type LibraryItemProps = {
  book: Book
  entry: LibraryEntry
  view: 'grid' | 'list'
  selecting: boolean
  selected: boolean
  onToggleSelect: () => void
}

export function LibraryItem({ book, entry, view, selecting, selected, onToggleSelect }: LibraryItemProps) {
  const line = statusLine(book, entry)

  if (!selecting) {
    return view === 'grid' ? (
      <BookCard book={book} variant="grid" />
    ) : (
      <BookCard
        book={book}
        variant="row"
        details={
          <div className="mt-0.5 space-y-0.5">
            {entry.rating !== null && <StarRating value={entry.rating} size="xs" />}
            {line && <p className="truncate text-xs">{line}</p>}
          </div>
        }
      />
    )
  }

  // Selection mode: the whole item is one checkbox (no nested controls)
  const check = (
    <span
      aria-hidden="true"
      className={cn(
        'flex size-6 shrink-0 items-center justify-center rounded-md border-2',
        selected ? 'border-foreground bg-foreground text-background' : 'border-muted-foreground bg-background',
      )}
    >
      {selected && <Check className="size-4" strokeWidth={3} />}
    </span>
  )

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      aria-label={`${book.title} by ${book.author}`}
      onClick={onToggleSelect}
      className={cn(
        'w-full rounded-lg text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
        // Selected = thick outline + filled check (never color alone)
        selected && 'ring-3 ring-foreground ring-offset-2 ring-offset-background',
        view === 'grid' ? 'relative' : 'flex min-h-14 items-center gap-3 p-2',
      )}
    >
      {view === 'grid' ? (
        <>
          <BookCover book={book} className="w-full" />
          <span className="absolute top-1.5 left-1.5">{check}</span>
        </>
      ) : (
        <>
          {check}
          <BookCover book={book} size="sm" />
          <span className="min-w-0 flex-1">
            <span className="block truncate book-title">{book.title}</span>
            <span className="block truncate text-xs text-muted-foreground">{book.author}</span>
            {line && <span className="block truncate text-xs">{line}</span>}
          </span>
        </>
      )}
    </button>
  )
}
