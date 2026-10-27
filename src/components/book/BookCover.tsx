import { useState } from 'react'
import type { Book } from '@/types/book'
import { coverSrcSets, largeCoverUrl } from '@/lib/covers'
import { cn } from '@/lib/utils'

export type BookCoverSize = 'sm' | 'md' | 'lg' | 'xl'

type BookCoverProps = {
  book: Pick<Book, 'title' | 'author' | 'coverUrl'>
  size?: BookCoverSize
  /** Override the fixed width, e.g. "w-full" inside a grid */
  className?: string
  /** Keeps the placeholder's author clear of an overlaid StatusChip */
  reserveBottom?: boolean
  /** "anonymous" for covers that get painted into a canvas (share-card export) */
  crossOrigin?: 'anonymous'
  /** The page's hero cover (above the fold, the biggest thing on screen): loaded first */
  large?: boolean
  /** Rendered width for picking a size, when className changes it (e.g. "160px" for the book page hero) */
  sizes?: string
}

// px: intrinsic size for <img width/height> (2:3), so the layout never jumps while covers load
const sizes: Record<BookCoverSize, { width: string; px: number; title: string; author: string; padding: string }> = {
  sm: { width: 'w-14', px: 56, title: 'text-[0.5rem] leading-tight line-clamp-4', author: 'hidden', padding: 'p-1 pl-1.5' },
  md: { width: 'w-26', px: 104, title: 'text-sm leading-snug line-clamp-4', author: 'text-[0.625rem]', padding: 'p-2 pl-3' },
  xl: { width: 'w-75', px: 300, title: 'text-4xl leading-tight line-clamp-5', author: 'text-xl', padding: 'p-6 pl-8' },
  lg: { width: 'w-33', px: 132, title: 'text-base leading-snug line-clamp-4', author: 'text-xs', padding: 'p-2.5 pl-3.5' },
}

export function BookCover({ book, size = 'md', className, reserveBottom = false, crossOrigin, large = false, sizes: sizesProp }: BookCoverProps) {
  const [failed, setFailed] = useState(false)
  const s = sizes[size]
  const alt = `Cover of ${book.title} by ${book.author}`
  const showImage = book.coverUrl !== null && !failed
  // Share cards (painted into the export canvas): the largest JPG, one URL that the CORS check can verify.
  // Everywhere else: WebP at 180/240/333px with the M/L JPGs as fallback, picked by the browser from the real width.
  const exported = Boolean(crossOrigin)
  const srcSets = book.coverUrl && !exported ? coverSrcSets(book.coverUrl) : null
  const src = book.coverUrl && exported ? largeCoverUrl(book.coverUrl) : book.coverUrl
  const eager = exported || large
  // "auto" = the rendered width (lazy images only); browsers without it use the fallback width
  const imgSizes = sizesProp ?? (eager ? `${s.px}px` : `auto, ${s.px}px`)

  return (
    <div
      className={cn(
        // Marginalia rule 4: covers are objects (one shadow token, a fixed 4px radius that never follows the
        // theme's --radius), never text on top
        'relative aspect-2/3 shrink-0 overflow-hidden rounded-cover bg-muted shadow-cover',
        s.width,
        className,
      )}
    >
      {showImage ? (
        <picture className="contents">
          {srcSets && <source type="image/webp" srcSet={srcSets.webp} sizes={imgSizes} />}
          <img
            src={src!}
            srcSet={srcSets?.jpg}
            sizes={srcSets ? imgSizes : undefined}
            alt={alt}
            width={s.px}
            height={s.px * 1.5}
            loading={eager ? 'eager' : 'lazy'}
            fetchPriority={large ? 'high' : undefined}
            crossOrigin={crossOrigin}
            decoding="async"
            onError={() => setFailed(true)}
            className="size-full object-cover"
          />
        </picture>
      ) : (
        // Placeholder that still reads as a book: spine shadow, serif title, author at the bottom
        <div role="img" aria-label={alt} className={cn('flex size-full flex-col justify-between', s.padding, reserveBottom && 'pb-6')}>
          <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-foreground/10" />
          <span aria-hidden="true" className={cn('font-semibold text-foreground', s.title)}>
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
