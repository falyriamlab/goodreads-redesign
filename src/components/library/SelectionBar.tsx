import { ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import { statusMeta, statusOrder } from '@/components/book/statusMeta'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useLibrary } from '@/state/library'
import type { ReadingStatus } from '@/types/library'

type Props = {
  selected: string[]
  onDone: () => void
  onCancel: () => void
}

const plural = (n: number) => `${n} ${n === 1 ? 'book' : 'books'}`

/** Fixed bar above the bottom nav while selecting. Every action has an Undo toast. */
export function SelectionBar({ selected, onDone, onCancel }: Props) {
  const shelves = useLibrary((s) => s.shelves)
  const bulkSetStatus = useLibrary((s) => s.bulkSetStatus)
  const bulkAddToShelf = useLibrary((s) => s.bulkAddToShelf)
  const bulkRemove = useLibrary((s) => s.bulkRemove)
  const takeSnapshot = useLibrary((s) => s.takeSnapshot)
  const restoreSnapshot = useLibrary((s) => s.restoreSnapshot)
  const n = selected.length

  function run(action: () => void, message: string) {
    const snapshot = takeSnapshot()
    action()
    toast(message, { action: { label: 'Undo', onClick: () => restoreSnapshot(snapshot) } })
    onDone()
  }

  const moveTo = (status: ReadingStatus) =>
    run(() => bulkSetStatus(selected, status), `Moved ${plural(n)} to ${statusMeta[status].label}.`)

  return (
    <div
      role="region"
      aria-label="Selection actions"
      className="fixed inset-x-0 bottom-[calc(3.5rem+1px+env(safe-area-inset-bottom))] z-30 mx-auto w-full max-w-app space-y-2 border-t border-border bg-background/95 px-4 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/80"
    >
      <div className="flex items-center justify-between">
        <p aria-live="polite" className="text-sm font-semibold">
          {n} selected
        </p>
        <Button variant="ghost" className="min-h-11" onClick={onCancel}>
          Cancel
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="min-h-11 border-muted-foreground px-2" disabled={n === 0}>
              Move to…
              <ChevronDown aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-48">
            <DropdownMenuLabel className="text-xs text-muted-foreground">Move {plural(n)} to</DropdownMenuLabel>
            {statusOrder.map((s) => {
              const { menuLabel, icon: Icon } = statusMeta[s]
              return (
                <DropdownMenuItem key={s} className="min-h-11" onSelect={() => moveTo(s)}>
                  <Icon aria-hidden="true" />
                  {menuLabel}
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="min-h-11 border-muted-foreground px-2"
              disabled={n === 0 || shelves.length === 0}
            >
              Add to shelf…
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="min-w-48">
            <DropdownMenuLabel className="text-xs text-muted-foreground">Add {plural(n)} to</DropdownMenuLabel>
            {shelves.map((shelf) => (
              <DropdownMenuItem
                key={shelf.id}
                className="min-h-11"
                onSelect={() => run(() => bulkAddToShelf(selected, shelf.id), `Added ${plural(n)} to ${shelf.name}.`)}
              >
                {shelf.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="outline"
          className="min-h-11 border-muted-foreground px-2"
          disabled={n === 0}
          onClick={() => run(() => bulkRemove(selected), `Removed ${plural(n)} from your library.`)}
        >
          Remove
        </Button>
      </div>
    </div>
  )
}
