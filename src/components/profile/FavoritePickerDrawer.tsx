import { useId, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { BookCover } from '@/components/book/BookCover'
import { StarRating } from '@/components/book/StarRating'
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import { normalize } from '@/lib/search'
import { books } from '@/mocks/books'
import { useLibrary } from '@/state/library'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Already chosen: hidden from the list */
  exclude: string[]
  onPick: (bookId: string) => void
}

/** Pick a favorite from books you've read (or loved) */
export function FavoritePickerDrawer({ open, onOpenChange, exclude, onPick }: Props) {
  const entries = useLibrary((s) => s.entries)
  const [query, setQuery] = useState('')
  const searchId = useId()

  const candidates = books
    .filter((b) => (entries[b.id]?.status === 'read' || entries[b.id]?.loved) && !exclude.includes(b.id))
    .filter((b) => !query || normalize(`${b.title} ${b.author}`).includes(normalize(query)))
    .sort((a, b) => (entries[b.id]?.rating ?? 0) - (entries[a.id]?.rating ?? 0))

  return (
    <Drawer
      open={open}
      autoFocus
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) setQuery('')
      }}
    >
      <DrawerContent className="mx-auto max-h-[85dvh] w-full max-w-app">
        <DrawerHeader className="text-left">
          <DrawerTitle className="section-title">Add a favorite</DrawerTitle>
          <DrawerDescription>Choose from books you've read.</DrawerDescription>
        </DrawerHeader>
        <div className="relative px-4 pb-2">
          <label htmlFor={searchId} className="sr-only">
            Search your read books
          </label>
          <Search className="pointer-events-none absolute top-1/2 left-7 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            id={searchId}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your read books"
            className="min-h-11 border-muted-foreground pl-9 text-base"
          />
        </div>
        <ul data-vaul-no-drag className="flex-1 divide-y divide-border overflow-y-auto px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          {candidates.map((b) => (
            <li key={b.id}>
              <button
                type="button"
                onClick={() => {
                  onPick(b.id)
                  onOpenChange(false)
                  setQuery('')
                }}
                className="flex w-full items-center gap-3 py-2 text-left outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <BookCover book={b} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate book-title">{b.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">{b.author}</span>
                  {entries[b.id]?.rating != null && <StarRating value={entries[b.id].rating} size="xs" />}
                </span>
                <Plus className="size-5 shrink-0" aria-hidden="true" />
                <span className="sr-only">Add to top 4</span>
              </button>
            </li>
          ))}
          {candidates.length === 0 && <p className="py-4 text-sm text-muted-foreground">No read books to add.</p>}
        </ul>
      </DrawerContent>
    </Drawer>
  )
}
