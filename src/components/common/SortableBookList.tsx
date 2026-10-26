import { useState, type ReactNode } from 'react'
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS as DndCSS } from '@dnd-kit/utilities'
import { ChevronDown, ChevronUp, GripVertical } from 'lucide-react'
import { Link } from 'react-router'
import { BookCover } from '@/components/book/BookCover'
import { cn } from '@/lib/utils'
import type { Book } from '@/types/book'

type SortableBookListProps = {
  books: Book[]
  /** Move a book to a position in `books` (0-based) */
  onMove: (bookId: string, toIndex: number) => void
  /** Accessible name of the list */
  label: string
  /** Extra control per row (e.g. Remove), rendered before the move buttons */
  renderAction?: (book: Book) => ReactNode
  /** Link titles to the book page (off inside forms) */
  linkTitles?: boolean
}

/**
 * Reorderable list of books. Drag by the handle (pointer, or keyboard: Space to lift, arrows to move,
 * Space to drop) or use Move up / Move down. Moves are announced; focus stays on the control.
 */
export function SortableBookList({ books, onMove, label, renderAction, linkTitles = true }: SortableBookListProps) {
  const [announcement, setAnnouncement] = useState('')
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const titleOf = (id: string | number) => books.find((b) => b.id === id)?.title ?? String(id)
  const positionOf = (id: string | number) => books.findIndex((b) => b.id === id) + 1

  // dnd-kit's default announcements use internal ids; speak titles and positions instead
  const announcements: Announcements = {
    onDragStart: ({ active }) => `Picked up ${titleOf(active.id)}, position ${positionOf(active.id)} of ${books.length}.`,
    onDragOver: ({ active, over }) =>
      over ? `${titleOf(active.id)} is over position ${positionOf(over.id)} of ${books.length}.` : undefined,
    onDragEnd: ({ active, over }) =>
      over ? `Dropped ${titleOf(active.id)} at position ${positionOf(over.id)} of ${books.length}.` : undefined,
    onDragCancel: ({ active }) => `Cancelled. ${titleOf(active.id)} stays at position ${positionOf(active.id)}.`,
  }
  const screenReaderInstructions = {
    draggable: 'To reorder, press Space, use the arrow keys to move, then press Space again to drop. Escape cancels.',
  }

  function moveTo(book: Book, toIndex: number, keepFocus?: 'up' | 'down') {
    onMove(book.id, toIndex)
    setAnnouncement(`${book.title} moved to position ${toIndex + 1} of ${books.length}.`)
    if (!keepFocus) return
    // Reordering moves the row's DOM node, which drops focus: put it back on the same control,
    // or on the opposite one when the row reached the top/bottom and this button got disabled
    requestAnimationFrame(() => {
      const find = (dir: 'up' | 'down') =>
        document.querySelector<HTMLButtonElement>(`button[aria-label="${CSS.escape(`Move ${book.title} ${dir}`)}"]`)
      const same = find(keepFocus)
      const other = find(keepFocus === 'up' ? 'down' : 'up')
      ;(same && !same.disabled ? same : other)?.focus()
    })
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return
    const book = books.find((b) => b.id === active.id)
    const toIndex = books.findIndex((b) => b.id === over.id)
    if (book && toIndex >= 0) moveTo(book, toIndex)
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
        accessibility={{ announcements, screenReaderInstructions }}
      >
        <SortableContext items={books.map((b) => b.id)} strategy={verticalListSortingStrategy}>
          <ol aria-label={label} className="divide-y divide-border">
            {books.map((book, i) => (
              <SortableRow
                key={book.id}
                book={book}
                position={i + 1}
                linkTitle={linkTitles}
                action={renderAction?.(book)}
                onUp={i > 0 ? () => moveTo(book, i - 1, 'up') : undefined}
                onDown={i < books.length - 1 ? () => moveTo(book, i + 1, 'down') : undefined}
              />
            ))}
          </ol>
        </SortableContext>
      </DndContext>
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </>
  )
}

const iconButton =
  'flex size-11 items-center justify-center rounded-md text-foreground outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-30'

function SortableRow({
  book,
  position,
  linkTitle,
  action,
  onUp,
  onDown,
}: {
  book: Book
  position: number
  linkTitle: boolean
  action?: ReactNode
  onUp?: () => void
  onDown?: () => void
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: book.id,
  })

  return (
    <li
      ref={setNodeRef}
      style={{ transform: DndCSS.Transform.toString(transform), transition }}
      className={cn('flex items-center gap-2 bg-background py-2', isDragging && 'relative z-10 shadow-lg ring-2 ring-foreground')}
    >
      <span className="w-6 shrink-0 text-center font-mono text-sm font-semibold tabular-nums" aria-hidden="true">
        {position}
      </span>
      <BookCover book={book} size="sm" />
      <div className="min-w-0 flex-1">
        {linkTitle ? (
          <Link
            to={`/book/${book.id}`}
            className="flex min-h-11 items-center text-sm leading-snug font-semibold outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <span className="line-clamp-2">{book.title}</span>
          </Link>
        ) : (
          <p className="line-clamp-2 book-title">{book.title}</p>
        )}
        <p className="truncate text-xs text-muted-foreground">{book.author}</p>
      </div>
      {action}
      <div className="flex flex-col">
        <button type="button" className={iconButton} onClick={onUp} disabled={!onUp} aria-label={`Move ${book.title} up`}>
          <ChevronUp className="size-5" aria-hidden="true" />
        </button>
        <button type="button" className={iconButton} onClick={onDown} disabled={!onDown} aria-label={`Move ${book.title} down`}>
          <ChevronDown className="size-5" aria-hidden="true" />
        </button>
      </div>
      <button
        type="button"
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        aria-label={`Reorder ${book.title}, position ${position}`}
        className={cn(iconButton, 'cursor-grab touch-none active:cursor-grabbing')}
      >
        <GripVertical className="size-5" aria-hidden="true" />
      </button>
    </li>
  )
}
