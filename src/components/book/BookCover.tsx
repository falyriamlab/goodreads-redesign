import { useState } from 'react'
import type { Book } from '@/types/book'
import { cn } from '@/lib/utils'

export type BookCoverSize = 'sm' | 'md' | 'lg'

type BookCoverProps = {
  book: Pick<Book, 'title' | 'author' | 'coverUrl'>
  size?: BookCoverSize
  /** Override the fixed width, e.g. "w-full" inside a grid */
  className?: string
  /** Keeps the placeholder's author clear of an overlaid StatusChip */
  reserveBottom?: boolean
}

// px: intrinsic size for <img width/height> (2:3), so the layout never jumps while covers load
const sizes: Record<BookCoverSize, { width: string; px: number; title: string; author: string; padding: string }> = {
  sm: { width: 'w-14', px: 56, title: 'text-[0.5rem] leading-tight line-clamp-4', author: 'hidden', padding: 'p-1 pl-1.5' },
  md: { width: 'w-26', px: 104, title: 'text-sm leading-snug line-clamp-4', author: 'text-[0.625rem]', padding: 'p-2 pl-3' },
  lg: { width: 'w-33', px: 132, title: 'text-base leading-snug line-clamp-4', author: 'text-xs', padding: 'p-2.5 pl-3.5' },
}

export function BookCover({ book, size = 'md', className, reserveBottom = false }: BookCoverProps) {
  const [failed, setFailed] = useState(false)
  const s = sizes[size]
  const alt = `Cover of ${book.title} by ${book.author}`
  const showImage = book.coverUrl !== null && !failed

  return (
    <div
      className={cn(
        'relative aspect-2/3 shrink-0 overflow-hidden rounded-md bg-muted shadow-sm ring-1 ring-foreground/10',
        s.width,
        className,
      )}
    >
      {showImage ? (
        <img
          src={book.coverUrl!}
          alt={alt}
          width={s.px}
          height={s.px * 1.5}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="size-full object-cover"
        />
      ) : (
        // Placeholder that still reads as a book: spine shadow, serif title, author at the bottom
        <div role="img" aria-label={alt} className={cn('flex size-full flex-col justify-between', s.padding, reserveBottom && 'pb-6')}>
          <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-foreground/10" />
          <span aria-hidden="true" className={cn('font-serif font-semibold text-foreground', s.title)}>
            {book.title}
          </span>
          <span aria-hidden="true" className={cn('truncate font-sans text-foreground/80', s.author)}>
            {book.author}
          </span>
        </div>
      )}
    </div>
  )
}
