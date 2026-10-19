import { X } from 'lucide-react'
import { StatusChip } from '@/components/book/StatusChip'
import { useLogSheet } from '@/components/log-sheet/context'
import { cn } from '@/lib/utils'
import { useLibraryEntry } from '@/state/library'
import { useShelfActions } from '@/state/useShelfActions'
import type { Book } from '@/types/book'

/** The compact status chip used by both directions' cards (a sibling button above the card's stretched link) */
export function CardChip({ book, className }: { book: Book; className?: string }) {
  const entry = useLibraryEntry(book.id)
  const { changeStatus, quickAdd } = useShelfActions()
  const logSheet = useLogSheet()
  return (
    <StatusChip
      bookId={book.id}
      bookTitle={book.title}
      status={entry.status}
      onStatusChange={(status) => changeStatus(book.id, status)}
      onQuickAdd={(openMenu) => quickAdd(book.id, openMenu)}
      onRequestLog={(bookId, intent, trigger) => logSheet.open(bookId, { intent, returnFocus: trigger })}
      variant="compact"
      isPublished={book.isPublished}
      className={cn('relative z-10 shrink-0', className)}
    />
  )
}

/** "Not my vibe": 44px hit area, 28px visual circle, raised above the stretched link */
export function DismissButton({ book, onDismiss, className }: { book: Book; onDismiss: () => void; className?: string }) {
  return (
    <button
      type="button"
      aria-label={`Not my vibe: hide ${book.title}`}
      onClick={onDismiss}
      className={cn('group/dismiss absolute z-10 flex size-11 items-center justify-center rounded-full outline-none', className)}
    >
      <span className="flex size-7 items-center justify-center rounded-full border border-muted-foreground bg-background text-foreground shadow-sm transition-colors group-hover/dismiss:bg-muted group-focus-visible/dismiss:ring-3 group-focus-visible/dismiss:ring-ring/50">
        <X className="size-4" strokeWidth={2.5} aria-hidden="true" />
      </span>
    </button>
  )
}

/**
 * Progress bar. Motion #1 in both directions: the fill grows in on mount (motion-safe only).
 * The numbers are always written next to it, so the bar is never the only carrier.
 */
export function ProgressBar({
  percent,
  label,
  valueText,
  className,
  trackClassName = 'bg-muted',
}: {
  percent: number
  label: string
  valueText: string
  className?: string
  trackClassName?: string
}) {
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      aria-valuetext={valueText}
      className={cn('h-2 overflow-hidden rounded-full', trackClassName, className)}
    >
      <div
        className="h-full origin-left rounded-full bg-primary motion-safe:animate-[fill-in_700ms_cubic-bezier(0.2,0.8,0.2,1)_both]"
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}
