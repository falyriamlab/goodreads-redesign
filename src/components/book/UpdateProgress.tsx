import { CircleAlert } from 'lucide-react'
import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { useLogSheet } from '@/components/log-sheet/context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { parsePageInput } from '@/lib/pageInput'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import { useLibrary } from '@/state/library'
import type { Book } from '@/types/book'

/**
 * "Update progress" button + popover with the page input (book page and Home).
 * Saving the last page doesn't just save: the same popover offers to mark the book as read.
 */
export function UpdateProgress({
  book,
  currentPage,
  variant = 'outline',
  className,
}: {
  book: Book
  currentPage: number
  /** default: the card's main action (Home, while there are pages left) */
  variant?: 'default' | 'outline'
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [page, setPage] = useState(String(currentPage))
  const [lastPage, setLastPage] = useState(false)
  const setProgress = useLibrary((s) => s.setProgress)
  const logSheet = useLogSheet()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const markReadRef = useRef<HTMLButtonElement>(null)
  const inputId = useId()
  const errorId = useId()
  const lastTitleId = useId()
  const lastTextId = useId()
  const input = parsePageInput(page, book.pages, { required: true })

  // The last-page step replaces the form: its first action takes the focus the Save button had
  useEffect(() => {
    if (lastPage) markReadRef.current?.focus()
  }, [lastPage])

  function save(value: number) {
    setProgress(book.id, value)
    toast('Progress saved.')
    setOpen(false)
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    // Enter key or not, an empty or out-of-range field never saves (empty used to save page 0)
    if (input.page === null) return
    if (input.page === book.pages) return setLastPage(true)
    save(input.page)
  }

  function markRead() {
    // The page is saved either way, so closing the sheet without logging still keeps it
    setProgress(book.id, book.pages)
    setOpen(false)
    logSheet.open(book.id, { intent: 'read', returnFocus: triggerRef.current })
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (next) {
          setPage(String(currentPage))
          setLastPage(false)
        }
        setOpen(next)
      }}
    >
      <PopoverTrigger asChild>
        <Button
          ref={triggerRef}
          variant={variant}
          data-log-sheet-opener=""
          className={cn('min-h-11', variant === 'outline' && 'border-muted-foreground', className)}
        >
          Update progress
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64">
        {lastPage ? (
          <div role="group" aria-labelledby={lastTitleId} aria-describedby={lastTextId} className="space-y-3">
            <div className="space-y-1">
              <p id={lastTitleId} className="font-semibold">
                That's the last page!
              </p>
              <p id={lastTextId} className="text-sm text-muted-foreground">
                Main character finish.
              </p>
            </div>
            <Button ref={markReadRef} className="min-h-11 w-full" onClick={markRead}>
              Mark as read
            </Button>
            <Button variant="outline" className="min-h-11 w-full border-muted-foreground" onClick={() => save(book.pages)}>
              Just save progress
            </Button>
          </div>
        ) : (
          // noValidate: our inline error replaces the browser's bubble
          <form onSubmit={submit} noValidate className="space-y-3">
            <Label htmlFor={inputId}>Current page</Label>
            <div className="flex items-center gap-2">
              <Input
                id={inputId}
                type="number"
                inputMode="numeric"
                value={page}
                onChange={(e) => setPage(e.target.value)}
                aria-invalid={!input.valid || undefined}
                aria-describedby={input.valid ? undefined : errorId}
                className="min-h-11 w-24 border-muted-foreground text-base"
              />
              <span className="text-sm text-muted-foreground">of {book.pages}</span>
            </div>
            {!input.valid && (
              <p id={errorId} className="flex items-center gap-1.5 text-sm font-medium">
                <CircleAlert className="size-4 shrink-0 text-destructive" aria-hidden="true" />
                {input.message}
              </p>
            )}
            <Button type="submit" className="min-h-11 w-full" disabled={!input.valid}>
              Save
            </Button>
          </form>
        )}
      </PopoverContent>
    </Popover>
  )
}
