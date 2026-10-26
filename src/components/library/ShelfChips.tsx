import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { Check, Pencil, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { useLibrary } from '@/state/library'
import type { Shelf } from '@/types/library'

const LONG_PRESS_MS = 500

const chipClass =
  "relative inline-flex h-9 shrink-0 items-center gap-1 rounded-full border px-3.5 text-sm whitespace-nowrap transition-colors outline-none select-none after:absolute after:-inset-y-1 after:inset-x-0 after:content-[''] focus-visible:ring-3 focus-visible:ring-ring/50"

type DrawerState = { mode: 'create' } | { mode: 'edit'; focusShelfId?: string } | null

/** "All" + custom shelves (single select), "+ New shelf" and "Edit". Long-press a shelf to edit it. */
export function ShelfChips({ value, onChange }: { value: string | null; onChange: (shelfId: string | null) => void }) {
  const shelves = useLibrary((s) => s.shelves)
  const [drawer, setDrawer] = useState<DrawerState>(null)

  return (
    <>
      <div role="group" aria-label="Custom shelves" className="flex gap-2 relative overflow-x-auto px-4 py-1">
        <ShelfChip label="All" pressed={value === null} onPress={() => onChange(null)} />
        {shelves.map((s) => (
          <ShelfChip
            key={s.id}
            label={s.name}
            pressed={value === s.id}
            onPress={() => onChange(value === s.id ? null : s.id)}
            onLongPress={() => setDrawer({ mode: 'edit', focusShelfId: s.id })}
          />
        ))}
        <button type="button" className={cn(chipClass, 'border-dashed border-muted-foreground font-medium')} onClick={() => setDrawer({ mode: 'create' })}>
          <Plus className="size-4" aria-hidden="true" />
          New shelf
        </button>
        {shelves.length > 0 && (
          <button
            type="button"
            className={cn(chipClass, 'border-transparent font-medium underline underline-offset-4')}
            onClick={() => setDrawer({ mode: 'edit' })}
          >
            <Pencil className="size-3.5" aria-hidden="true" />
            Edit<span className="sr-only"> shelves</span>
          </button>
        )}
      </div>

      <ShelvesDrawer
        state={drawer}
        onClose={() => setDrawer(null)}
        onCreated={(id) => onChange(id)}
        onDeleted={(id) => value === id && onChange(null)}
      />
    </>
  )
}

function ShelfChip({
  label,
  pressed,
  onPress,
  onLongPress,
}: {
  label: string
  pressed: boolean
  onPress: () => void
  onLongPress?: () => void
}) {
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const longPressed = useRef(false)
  const cancel = () => clearTimeout(timer.current)

  return (
    <button
      type="button"
      aria-pressed={pressed}
      onPointerDown={() => {
        if (!onLongPress) return
        longPressed.current = false
        timer.current = setTimeout(() => {
          longPressed.current = true
          onLongPress()
        }, LONG_PRESS_MS)
      }}
      onPointerUp={cancel}
      onPointerLeave={cancel}
      onContextMenu={(e) => onLongPress && e.preventDefault()}
      onClick={() => {
        // A long press already opened the editor: don't also toggle the filter
        if (longPressed.current) return
        onPress()
      }}
      className={cn(
        chipClass,
        pressed ? 'border-foreground bg-foreground font-semibold text-background' : 'border-muted-foreground bg-background font-medium hover:bg-muted',
      )}
    >
      {pressed && <Check className="size-4" strokeWidth={3} aria-hidden="true" />}
      {label}
    </button>
  )
}

function ShelvesDrawer({
  state,
  onClose,
  onCreated,
  onDeleted,
}: {
  state: DrawerState
  onClose: () => void
  onCreated: (id: string) => void
  onDeleted: (id: string) => void
}) {
  const shelves = useLibrary((s) => s.shelves)
  const createShelf = useLibrary((s) => s.createShelf)
  const [name, setName] = useState('')
  const inputId = useId()

  function create(e: FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    const id = createShelf(trimmed)
    toast(`Shelf "${trimmed}" created.`)
    setName('')
    onCreated(id)
    onClose()
  }

  return (
    <Drawer open={state !== null} onOpenChange={(open) => !open && onClose()} autoFocus>
      <DrawerContent className="mx-auto max-h-[85dvh] w-full max-w-app">
        {state?.mode === 'create' ? (
          <form onSubmit={create}>
            <DrawerHeader className="text-left">
              <DrawerTitle className="section-title">New shelf</DrawerTitle>
              <DrawerDescription>Group books your way. A book can be on as many shelves as you like.</DrawerDescription>
            </DrawerHeader>
            <div className="space-y-1.5 px-4">
              <Label htmlFor={inputId}>Shelf name</Label>
              <Input
                id={inputId}
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={40}
                autoComplete="off"
                className="min-h-11 border-muted-foreground text-base"
              />
            </div>
            <div className="grid grid-cols-2 gap-3 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
              <Button type="button" variant="outline" size="lg" className="min-h-11 border-muted-foreground" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" size="lg" className="min-h-11" disabled={!name.trim()}>
                Create shelf
              </Button>
            </div>
          </form>
        ) : (
          <>
            <DrawerHeader className="text-left">
              <DrawerTitle className="section-title">Edit shelves</DrawerTitle>
              <DrawerDescription>Rename or delete. Deleting a shelf never removes its books.</DrawerDescription>
            </DrawerHeader>
            <ul data-vaul-no-drag className="flex-1 space-y-3 overflow-y-auto px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
              {shelves.map((s) => (
                <ShelfEditor key={s.id} shelf={s} autoFocus={state?.mode === 'edit' && state.focusShelfId === s.id} onDeleted={onDeleted} />
              ))}
              {shelves.length === 0 && <p className="text-sm text-muted-foreground">No custom shelves yet.</p>}
            </ul>
          </>
        )}
      </DrawerContent>
    </Drawer>
  )
}

function ShelfEditor({ shelf, autoFocus, onDeleted }: { shelf: Shelf; autoFocus: boolean; onDeleted: (id: string) => void }) {
  const renameShelf = useLibrary((s) => s.renameShelf)
  const deleteShelf = useLibrary((s) => s.deleteShelf)
  const [name, setName] = useState(shelf.name)
  const [confirming, setConfirming] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const keepRef = useRef<HTMLButtonElement>(null)
  const inputId = useId()

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus()
  }, [autoFocus])

  // Move focus into the inline confirmation so keyboard users land on it
  useEffect(() => {
    if (confirming) keepRef.current?.focus()
  }, [confirming])

  const changed = name.trim() !== '' && name.trim() !== shelf.name

  return (
    <li className="space-y-2 rounded-lg border border-border p-3">
      <form
        className="flex items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          if (!changed) return
          renameShelf(shelf.id, name)
          toast('Shelf renamed.')
        }}
      >
        <div className="flex-1 space-y-1">
          <Label htmlFor={inputId} className="text-xs text-muted-foreground">
            {shelf.bookIds.length} {shelf.bookIds.length === 1 ? 'book' : 'books'}
          </Label>
          <Input
            ref={inputRef}
            id={inputId}
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
            aria-label={`Name of shelf ${shelf.name}`}
            className="min-h-11 border-muted-foreground text-base"
          />
        </div>
        <Button type="submit" variant="outline" className="min-h-11 border-muted-foreground" disabled={!changed}>
          Save
        </Button>
        <Button type="button" variant="outline" className="min-h-11 border-muted-foreground" onClick={() => setConfirming(true)}>
          Delete
        </Button>
      </form>

      {confirming && (
        // In-page confirmation (never window.confirm)
        <div role="group" aria-label={`Confirm deleting ${shelf.name}`} className="space-y-2 rounded-md bg-muted p-3">
          <p className="text-sm">
            Delete "{shelf.name}"? Its books stay in your library.
          </p>
          <div className="flex gap-2">
            <Button ref={keepRef} variant="outline" className="min-h-11 flex-1 border-muted-foreground" onClick={() => setConfirming(false)}>
              Keep it
            </Button>
            <Button
              className="min-h-11 flex-1"
              onClick={() => {
                deleteShelf(shelf.id)
                onDeleted(shelf.id)
                toast(`Shelf "${shelf.name}" deleted.`)
              }}
            >
              Delete shelf
            </Button>
          </div>
        </div>
      )}
    </li>
  )
}
