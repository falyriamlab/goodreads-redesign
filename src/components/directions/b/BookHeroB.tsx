import { ListPlus } from 'lucide-react'
import { BookCover } from '@/components/book/BookCover'
import { LovedButton } from '@/components/book/LovedButton'
import { StarRating } from '@/components/book/StarRating'
import { StatusChip } from '@/components/book/StatusChip'
import { UpdateProgress } from '@/components/book/UpdateProgress'
import { Button } from '@/components/ui/button'
import type { Book } from '@/types/book'
import { readingProgress } from '../progress'
import { ProgressBar } from '../shared'
import { useBookActions } from '../useBookActions'

const kicker = 'text-xs font-semibold tracking-[0.16em] uppercase'

/**
 * Book page, B · Night Shelf: the cover bleeds full width (blurred) behind a dark band.
 * Two layers over the image:
 *  1. behind the sharp cover (no text): gradient scrim 30% → 90%
 *  2. behind all text and actions: a flat 90% scrim
 * So the worst point under any text is 90% scrim over a pure white cover: 9.96:1 (on-scrim), 4.98:1 (muted).
 * The band carries the `dark` class, so it stays dark in light mode too (dark-first).
 */
export function BookHeroB({ book }: { book: Book }) {
  const a = useBookActions(book)
  const p = readingProgress(book, a.entry.currentPage)

  return (
    <div className="dark relative isolate -mx-4 -mt-4 overflow-hidden bg-background text-on-scrim">
      {book.coverUrl && (
        <img src={book.coverUrl} alt="" aria-hidden="true" className="absolute inset-0 -z-10 size-full scale-150 object-cover blur-3xl" />
      )}
      <div className="bg-linear-to-b from-scrim/30 to-scrim/90 px-4 pt-6 pb-8">
        <BookCover
          book={book}
          className="mx-auto w-44 rounded-md shadow-cover ring-0 motion-safe:animate-[cover-rise_500ms_cubic-bezier(0.2,0.8,0.2,1)_both]"
        />
      </div>

      <section aria-label="Your shelf" className="space-y-5 bg-scrim/90 px-4 pb-8 text-center">
        <div>
          {book.series && (
            <p className={`${kicker} text-on-scrim-muted`}>
              {book.series} · Book {book.seriesNumber}
            </p>
          )}
          <h1 className="mt-2 font-serif text-[2.5rem] leading-[1.05] font-semibold tracking-tight text-balance">{book.title}</h1>
          <p className="mt-2 text-base text-on-scrim-muted">
            {book.author} · {book.pages} pages
            {!book.isPublished && ' · Not out yet'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <StatusChip variant="primary" {...a.chipProps} className="h-12 flex-1 rounded-full text-base" />
          <LovedButton iconOnly pressed={a.entry.loved} onPressedChange={a.toggleLoved} className="size-12 rounded-full" />
          <Button
            variant="outline"
            size="icon"
            className="size-12 rounded-full border-on-scrim-muted bg-transparent [&_svg]:size-5"
            aria-label={`Add ${book.title} to a list`}
            onClick={a.addToList}
          >
            <ListPlus aria-hidden="true" />
          </Button>
        </div>

        {a.isReading && (
          <div className="space-y-3 text-left">
            <div className="flex items-end justify-between gap-3">
              <p className="flex items-baseline gap-1">
                <span className="font-serif text-[56px] leading-none font-semibold tabular-nums">{p.percent}</span>
                <span className="font-serif text-xl">%</span>
                <span className="sr-only"> read</span>
              </p>
              <p className="pb-1 text-sm text-on-scrim-muted">{p.detail}</p>
            </div>
            <ProgressBar percent={p.percent} label={`Progress in ${book.title}`} valueText={p.detail} />
            <UpdateProgress book={book} currentPage={a.entry.currentPage} className="w-full" />
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 text-left">
          <p className="text-sm font-semibold">Your rating</p>
          <StarRating mode="input" value={a.entry.rating} onChange={a.rate} label={`Your rating for ${book.title}`} />
        </div>
      </section>
    </div>
  )
}
