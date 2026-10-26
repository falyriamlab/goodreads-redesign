import { useId, useState } from 'react'
import { Search, Send } from 'lucide-react'
import { BookCover } from '@/components/book/BookCover'
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import { searchBooks } from '@/lib/search'
import { books } from '@/mocks/books'
import { useLibrary } from '@/state/library'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  recipientName: string
  onPick: (bookId: string) => void
}

/** Search the catalog and send a book. Empty query: what you're reading, then your recent reads. */
export function ShareBookDrawer({ open, onOpenChange, recipientName, onPick }: Props) {
  const entries = useLibrary((s) => s.entries)
  const [query, setQuery] = useState('')
  const searchId = useId()

  const suggested = [...books]
    .filter((b) => entries[b.id]?.status === 'reading' || entries[b.id]?.status === 'read')
    .sort((a, b) => {
      const rank = (id: string) => (entries[id]?.status === 'reading' ? 0 : 1)
      return rank(a.id) - rank(b.id) || (entries[b.id]?.finishedAt ?? '').localeCompare(entries[a.id]?.finishedAt ?? '')
    })
    .slice(0, 8)
  const list = query.trim() ? searchBooks(query, books).results.map((r) => r.book).slice(0, 12) : suggested

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
          <DrawerTitle className="section-title">Share a book</DrawerTitle>
          <DrawerDescription>Send it to {recipientName}. It goes out as soon as you pick it.</DrawerDescription>
        </DrawerHeader>
        <div className="relative px-4 pb-2">
          <label htmlFor={searchId} className="sr-only">
            Search books
          </label>
          <Search className="pointer-events-none absolute top-1/2 left-7 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            id={searchId}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title or author"
            className="min-h-11 border-muted-foreground pl-9 text-base"
          />
        </div>
        {!query.trim() && <p className="px-4 pt-1 text-xs font-semibold text-muted-foreground">From your shelves</p>}
        <ul data-vaul-no-drag aria-label="Books" className="flex-1 divide-y divide-border overflow-y-auto px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          {list.map((b) => (
            <li key={b.id}>
              <button
                type="button"
                onClick={() => {
                  onPick(b.id)
                  setQuery('')
                }}
                className="flex w-full items-center gap-3 py-2 text-left outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <span aria-hidden="true">
                  <BookCover book={b} size="sm" className="w-10" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate book-title">{b.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">{b.author}</span>
                </span>
                <Send className="size-4 shrink-0" aria-hidden="true" />
                <span className="sr-only">Send to {recipientName}</span>
              </button>
            </li>
          ))}
          {list.length === 0 && <p className="py-4 text-sm text-muted-foreground">No books match that. Try another title.</p>}
        </ul>
      </DrawerContent>
    </Drawer>
  )
}
