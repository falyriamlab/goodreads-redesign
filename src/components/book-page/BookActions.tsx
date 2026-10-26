import { ListPlus } from 'lucide-react'
import { LovedButton } from '@/components/book/LovedButton'
import { StarRating } from '@/components/book/StarRating'
import { StatusChip } from '@/components/book/StatusChip'
import { UpdateProgress } from '@/components/book/UpdateProgress'
import { ProgressBar } from '@/components/common/ProgressBar'
import { Button } from '@/components/ui/button'
import { readingProgress } from '@/lib/readingProgress'
import type { Book } from '@/types/book'
import { useBookActions } from './useBookActions'

/** "Your shelf" under the hero: status first, then progress (display number), rating, love and lists */
export function BookActions({ book }: { book: Book }) {
  const a = useBookActions(book)
  const p = readingProgress(book, a.entry.currentPage)

  return (
    <section aria-label="Your shelf" className="space-y-4">
      <StatusChip variant="primary" {...a.chipProps} className="h-12 w-full text-base" />

      {a.isReading && (
        <div className="space-y-2">
          <div className="flex items-end justify-between gap-3">
            <p className="flex items-baseline gap-1">
              <span className="display-lg">{p.percent}</span>
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
