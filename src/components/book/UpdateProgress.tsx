import { CircleAlert } from 'lucide-react'
import { useId, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { parsePageInput } from '@/lib/pageInput'
import { cn } from '@/lib/utils'
import { useLibrary } from '@/state/library'
import type { Book } from '@/types/book'

/** "Update progress" button + popover with the page input (book page and Home) */
export function UpdateProgress({
  book,
  currentPage,
  className,
}: {
  book: Book
  currentPage: number
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [page, setPage] = useState(String(currentPage))
  const setProgress = useLibrary((s) => s.setProgress)
  const inputId = useId()
  const errorId = useId()
  const input = parsePageInput(page, book.pages, { required: true })

  function submit(event: FormEvent) {
    event.preventDefault()
    // Enter key or not, an empty or out-of-range field never saves (empty used to save page 0)
    if (input.page === null) return
    setProgress(book.id, input.page)
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
        <Button variant="outline" className={cn('min-h-11 border-muted-foreground', className)}>
          Update progress
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64">
        {/* noValidate: our inline error replaces the browser's bubble */}
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
      </PopoverContent>
    </Popover>
  )
}
