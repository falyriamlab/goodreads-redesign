import { useRef } from 'react'
import { ChevronDown, Plus, Trash2 } from 'lucide-react'
import type { ReadingStatus } from '@/types/library'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { statusMeta, statusOrder } from './statusMeta'

export type LogRequest = (bookId: string, status: 'read' | 'dnf', trigger: HTMLElement | null) => void

type StatusChipProps = {
  bookId: string
  /** Used in the accessible name: "Reading, change shelf for Fourth Wing" */
  bookTitle: string
  status: ReadingStatus | null
  onStatusChange: (status: ReadingStatus | null) => void
  /**
   * When set, choosing Read or DNF opens the log sheet instead of changing the status
   * right away (the sheet's Save commits it). Without it, the status changes immediately.
   */
  onRequestLog?: LogRequest
  /** Upcoming books can't be marked Read or DNF */
  isPublished?: boolean
  /**
   * chip:    pill with full label (rows, lists)
   * compact: short label, never wider than a md cover (carousels, grids)
   * primary: full-width primary button (book page)
   */
  variant?: 'chip' | 'compact' | 'primary'
  /** Replaces the visible label, e.g. "Reading · p. 312" */
  label?: string
  className?: string
}

const compactLabel: Record<ReadingStatus, string> = { want: 'Want', reading: 'Reading', read: 'Read', dnf: 'DNF' }

export function StatusChip({
  bookId,
  bookTitle,
  status,
  onStatusChange,
  onRequestLog,
  isPublished = true,
  variant = 'chip',
  label,
  className,
}: StatusChipProps) {
  const triggerRef = useRef<HTMLButtonElement>(null)
  // Read/DNF hand off to the log sheet, but only once the menu has fully closed:
  // otherwise the closing menu pulls focus back to its trigger, outside the sheet
  const pendingLogRef = useRef<'read' | 'dnf' | null>(null)
  const Icon = status ? statusMeta[status].icon : Plus
  const fullLabel = status ? statusMeta[status].label : 'Want to read'
  const visibleLabel = label ?? (variant === 'compact' ? (status ? compactLabel[status] : 'Want') : fullLabel)
  const ariaLabel = status
    ? `${label ?? fullLabel}, change shelf for ${bookTitle}`
    : `Add ${bookTitle} to Want to read`

  function choose(next: string) {
    const value = next as ReadingStatus
    if ((value === 'read' || value === 'dnf') && onRequestLog) {
      pendingLogRef.current = value
      return
    }
    onStatusChange(value)
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        ref={triggerRef}
        aria-label={ariaLabel}
        className={cn(
          'relative inline-flex max-w-full min-w-11 items-center justify-center font-semibold whitespace-nowrap transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
          variant === 'primary'
            ? 'min-h-11 w-full gap-2 rounded-lg px-4 text-sm'
            : cn(
                // Visual pill is 32px tall; the ::after extends the hit area to 44px
                "h-8 rounded-full text-xs shadow-sm after:absolute after:-inset-y-1.5 after:inset-x-0 after:content-['']",
                variant === 'compact' ? 'gap-0.5 px-2.5' : 'gap-1 px-3',
              ),
          status === null
            ? 'border border-input bg-background text-foreground hover:bg-muted'
            : 'bg-primary text-primary-foreground hover:bg-primary/90',
          className,
        )}
      >
        <Icon className={variant === 'primary' ? 'size-4' : 'size-3.5'} strokeWidth={2.5} aria-hidden="true" />
        <span className="truncate">{visibleLabel}</span>
        {status !== null && (
          <ChevronDown className={cn('shrink-0', variant === 'primary' ? 'size-4' : 'size-3.5')} aria-hidden="true" />
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="center"
        className="min-w-52"
        onCloseAutoFocus={(event) => {
          const pending = pendingLogRef.current
          if (!pending || !onRequestLog) return
          pendingLogRef.current = null
          event.preventDefault()
          onRequestLog(bookId, pending, triggerRef.current)
        }}
      >
        <DropdownMenuLabel className="text-xs text-muted-foreground">Shelve it</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={status ?? ''} onValueChange={choose}>
          {statusOrder.map((s) => {
            const { menuLabel, icon: ItemIcon } = statusMeta[s]
            const disabled = !isPublished && (s === 'read' || s === 'dnf')
            return (
              <DropdownMenuRadioItem key={s} value={s} disabled={disabled} className="min-h-11">
                <ItemIcon aria-hidden="true" />
                {menuLabel}
              </DropdownMenuRadioItem>
            )
          })}
        </DropdownMenuRadioGroup>
        {status !== null && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="min-h-11" onSelect={() => onStatusChange(null)}>
              <Trash2 aria-hidden="true" />
              Remove from shelves
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
