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

type StatusChipProps = {
  bookId: string
  /** Used in the accessible name: "Reading, change shelf for Fourth Wing" */
  bookTitle: string
  status: ReadingStatus | null
  onStatusChange: (status: ReadingStatus | null) => void
  /** Fired after choosing Read or DNF (step 3: opens the log sheet) */
  onRequestLog?: (bookId: string) => void
  /** Upcoming books can't be marked Read or DNF */
  isPublished?: boolean
  className?: string
}

export function StatusChip({
  bookId,
  bookTitle,
  status,
  onStatusChange,
  onRequestLog,
  isPublished = true,
  className,
}: StatusChipProps) {
  const meta = status ? statusMeta[status] : null
  const Icon = meta?.icon ?? Plus
  const label = meta?.label ?? 'Want to read'

  function choose(next: string) {
    const value = next as ReadingStatus
    onStatusChange(value)
    if (value === 'read' || value === 'dnf') onRequestLog?.(bookId)
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        aria-label={status ? `${label}, change shelf for ${bookTitle}` : `Want to read, add ${bookTitle} to a shelf`}
        className={cn(
          // Visual pill is 32px tall; the ::after extends the hit area to 44px
          'relative inline-flex h-8 min-w-11 items-center justify-center gap-1 rounded-full px-3 text-xs font-semibold whitespace-nowrap shadow-sm transition-colors outline-none',
          "after:absolute after:-inset-y-1.5 after:inset-x-0 after:content-['']",
          'focus-visible:ring-3 focus-visible:ring-ring/50',
          status === null
            ? 'border border-input bg-background text-foreground hover:bg-muted'
            : 'bg-primary text-primary-foreground hover:bg-primary/90',
          className,
        )}
      >
        <Icon className="size-3.5" strokeWidth={2.5} aria-hidden="true" />
        <span>{label}</span>
        {status !== null && <ChevronDown className="size-3.5" aria-hidden="true" />}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="center" className="min-w-52">
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
