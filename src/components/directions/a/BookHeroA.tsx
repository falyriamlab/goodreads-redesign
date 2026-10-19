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
 * Book page, A · Marginalia: a full-bleed paper band with the cover as an object,
 * a centered serif title and a facts strip; then a quiet "Your shelf" block.
 * Band text: --band-foreground 10.77:1 / 11.89:1, --band-muted-foreground 5.57:1 / 5.94:1.
 */
export function BookHeroA({ book }: { book: Book }) {
  return (
    <div className="-mx-4 -mt-4 bg-band px-4 pt-8 pb-6 text-center text-band-foreground">
      <BookCover book={book} className="mx-auto w-40 rounded-sm shadow-cover ring-0" />
      {book.series && (
        <p className={`${kicker} mt-6 text-band-muted-foreground`}>
          {book.series} · Book {book.seriesNumber}
        </p>
      )}
      <h1 className="mt-2 font-serif text-[2.5rem] leading-[1.05] font-semibold tracking-tight text-balance">{book.title}</h1>
      <p className="mt-2 text-base">{book.author}</p>
      <dl className="mt-6 grid grid-cols-3 divide-x divide-band-muted-foreground/40 border-y border-band-muted-foreground/40 py-3">
        <Fact label="Pages" value={String(book.pages)} />
        <Fact label="Chapters" value={book.chapterCount ? String(book.chapterCount) : '–'} />
        <Fact label="Ratings" value={book.ratingsCount === null ? 'None yet' : book.ratingsCount.toLocaleString('en-US')} />
      </dl>
      {!book.isPublished && <p className="mt-3 text-sm font-semibold">Not out yet</p>}
    </div>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    // dt first in the DOM; flex-col-reverse puts the number on top
    <div className="flex flex-col-reverse items-center px-1">
      <dt className="text-xs text-band-muted-foreground">{label}</dt>
      <dd className="font-serif text-xl font-semibold tabular-nums">{value}</dd>
    </div>
  )
}

export function BookActionsA({ book }: { book: Book }) {
  const a = useBookActions(book)
  const p = readingProgress(book, a.entry.currentPage)

  return (
    <section aria-label="Your shelf" className="space-y-5">
      <StatusChip variant="primary" {...a.chipProps} className="h-12 w-full text-base" />

      {a.isReading && (
        <div className="space-y-3">
          <div className="flex items-end justify-between gap-3">
            <p className="flex items-baseline gap-1">
              <span className="font-serif text-[56px] leading-none font-semibold tabular-nums">{p.percent}</span>
              <span className="font-serif text-xl">%</span>
              <span className="sr-only"> read</span>
            </p>
            <p className="pb-1 text-sm text-muted-foreground">{p.detail}</p>
          </div>
          <ProgressBar percent={p.percent} label={`Progress in ${book.title}`} valueText={p.detail} />
          <UpdateProgress book={book} currentPage={a.entry.currentPage} className="w-full" />
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
        <p className="font-serif text-lg font-semibold">Your rating</p>
        <StarRating mode="input" value={a.entry.rating} onChange={a.rate} label={`Your rating for ${book.title}`} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <LovedButton pressed={a.entry.loved} onPressedChange={a.toggleLoved} className="min-h-11 w-full" />
        <Button variant="outline" className="min-h-11 w-full border-muted-foreground" onClick={a.addToList}>
          <ListPlus aria-hidden="true" />
          Add to list
        </Button>
      </div>
    </section>
  )
}
