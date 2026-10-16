import { useId, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
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
        <Button variant="outline" className={cn('min-h-11 border-muted-foreground', className)}>
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
