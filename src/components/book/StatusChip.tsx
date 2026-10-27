import { useRef, useState, type KeyboardEvent, type MouseEvent, type PointerEvent } from 'react'
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
  /**
   * Unshelved books: one tap adds straight to Want to read instead of opening the menu.
   * Receives a function that opens this chip's menu (for the toast's "Change shelf").
   */
  onQuickAdd?: (openMenu: () => void) => void
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
  onQuickAdd,
  isPublished = true,
  variant = 'chip',
  label,
  className,
}: StatusChipProps) {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const quick = status === null && onQuickAdd !== undefined
  const openMenu = () => setOpen(true)
  // Read/DNF hand off to the log sheet, but only once the menu has fully closed:
  // otherwise the closing menu pulls focus back to its trigger, outside the sheet
  const pendingLogRef = useRef<'read' | 'dnf' | null>(null)
  const Icon = status ? statusMeta[status].icon : Plus
  const fullLabel = status ? statusMeta[status].label : 'Want to read'
  const visibleLabel = label ?? (variant === 'compact' ? (status ? compactLabel[status] : 'Want') : fullLabel)
  const ariaLabel = status
    ? `${label ?? fullLabel}, change shelf for ${bookTitle}`
    : `Add ${bookTitle} to Want to read`

  // Quick add intercepts the trigger before Radix opens the menu (preventDefault skips its handler)
  const quickHandlers = quick
    ? {
        onPointerDown: (e: PointerEvent) => e.preventDefault(),
        onClick: (e: MouseEvent) => {
          // detail 0 = keyboard-generated click, already handled in onKeyDown
          if (e.detail !== 0) onQuickAdd(openMenu)
        },
        onKeyDown: (e: KeyboardEvent) => {
          if (e.key !== 'Enter' && e.key !== ' ' && e.key !== 'ArrowDown') return
          e.preventDefault()
          onQuickAdd(openMenu)
        },
      }
    : {}

  function choose(next: string) {
    const value = next as ReadingStatus
    if ((value === 'read' || value === 'dnf') && onRequestLog) {
      pendingLogRef.current = value
      return
    }
    onStatusChange(value)
  }

  return (
    <DropdownMenu modal={false} open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        ref={triggerRef}
        {...quickHandlers}
        aria-label={ariaLabel}
        className={cn(
          'relative inline-flex max-w-full min-w-11 items-center justify-center font-semibold whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          variant === 'primary'
            ? 'min-h-11 w-full gap-2 rounded-lg px-4 text-sm'
            : cn(
                // Visual pill is 32px tall; the ::after extends the hit area to 44px
                "h-8 rounded-full text-xs shadow-sm after:absolute after:-inset-y-1.5 after:inset-x-0 after:content-['']",
                variant === 'compact' ? 'gap-0.5 px-2.5' : 'gap-1 px-3',
              ),
          // Shelved = neutral fill + the shelf's own icon and name (never hue alone). Only the book page's
          // big "Want to read" (variant primary, nothing shelved yet) is the view's main action in --primary.
          status !== null
            ? 'border border-muted-foreground bg-secondary text-secondary-foreground hover:bg-secondary/80'
            : variant === 'primary'
              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
              : 'border border-input bg-background text-foreground hover:bg-muted',
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
