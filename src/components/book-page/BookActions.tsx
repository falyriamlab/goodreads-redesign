import { useId, useState, type FormEvent } from 'react'
import { ListPlus } from 'lucide-react'
import { toast } from 'sonner'
import { LovedButton } from '@/components/book/LovedButton'
import { StarRating } from '@/components/book/StarRating'
import { StatusChip } from '@/components/book/StatusChip'
import { useLogSheet } from '@/components/log-sheet/context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useLibrary, useLibraryEntry } from '@/state/library'
import { useShelfActions } from '@/state/useShelfActions'
import type { Book } from '@/types/book'

export function BookActions({ book }: { book: Book }) {
  const entry = useLibraryEntry(book.id)
  const changeStatus = useShelfActions()
  const toggleLoved = useLibrary((s) => s.toggleLoved)
  const setRating = useLibrary((s) => s.setRating)
  const logSheet = useLogSheet()
  const ratingLabelId = useId()

  const isReading = entry.status === 'reading'
  const percent = Math.min(100, Math.round((entry.currentPage / book.pages) * 100))

  function rate(value: number, slider: HTMLElement | null) {
    if (entry.status === 'read') return setRating(book.id, value)
    // Rating a book you haven't finished = you finished it: log it with the rating prefilled
    logSheet.open(book.id, { intent: 'read', rating: value, returnFocus: slider })
  }

  return (
    <section aria-label="Your shelf" className="space-y-4 rounded-xl border border-border bg-card p-4 text-card-foreground">
      <div className="flex items-center gap-2">
        <StatusChip
          variant="primary"
          bookId={book.id}
          bookTitle={book.title}
          status={entry.status}
          label={isReading ? `Reading · p. ${entry.currentPage}` : undefined}
          isPublished={book.isPublished}
          onStatusChange={(status) => changeStatus(book.id, status)}
          onRequestLog={(bookId, intent, trigger) => logSheet.open(bookId, { intent, returnFocus: trigger })}
          className="flex-1"
        />
        <LovedButton iconOnly pressed={entry.loved} onPressedChange={() => toggleLoved(book.id)} />
        <Button
          variant="ghost"
          size="icon"
          className="size-11 [&_svg]:size-5"
          aria-label={`Add ${book.title} to a list`}
          onClick={() => toast('Lists drop soon.')}
        >
          <ListPlus aria-hidden="true" />
        </Button>
      </div>

      {isReading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span>
              <span className="font-semibold">p. {entry.currentPage}</span>
              <span className="text-muted-foreground">
                {' '}
                of {book.pages} · {percent}%
              </span>
            </span>
            <UpdateProgress book={book} currentPage={entry.currentPage} />
          </div>
          <div aria-hidden="true" className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p id={ratingLabelId} className="text-sm font-semibold">
          Your rating
        </p>
        <StarRating
          mode="input"
          value={entry.rating}
          onChange={(value) => rate(value, document.activeElement instanceof HTMLElement ? document.activeElement : null)}
          label={`Your rating for ${book.title}`}
        />
      </div>
    </section>
  )
}

function UpdateProgress({ book, currentPage }: { book: Book; currentPage: number }) {
  const [open, setOpen] = useState(false)
  const [page, setPage] = useState(String(currentPage))
  const setProgress = useLibrary((s) => s.setProgress)
  const inputId = useId()

  function submit(event: FormEvent) {
    event.preventDefault()
    const value = Math.min(book.pages, Math.max(0, Number(page)))
    setProgress(book.id, value)
    toast('Progress saved.')
    setOpen(false)
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (next) setPage(String(currentPage))
        setOpen(next)
      }}
    >
      <PopoverTrigger asChild>
        <Button variant="outline" className="min-h-11 border-muted-foreground">
          Update progress
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64">
        <form onSubmit={submit} className="space-y-3">
          <Label htmlFor={inputId}>Current page</Label>
          <div className="flex items-center gap-2">
            <Input
              id={inputId}
              type="number"
              inputMode="numeric"
              min={0}
              max={book.pages}
              value={page}
              onChange={(e) => setPage(e.target.value)}
              className="min-h-11 w-24 border-muted-foreground text-base"
            />
            <span className="text-sm text-muted-foreground">of {book.pages}</span>
          </div>
          <Button type="submit" className="min-h-11 w-full">
            Save
          </Button>
        </form>
      </PopoverContent>
    </Popover>
  )
}
