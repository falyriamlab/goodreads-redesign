import { useId, useState, type ReactNode } from 'react'
import { ArrowUpDown, LayoutGrid, List, ListChecks, Search, SlidersHorizontal } from 'lucide-react'
import { Link, useSearchParams } from 'react-router'
import { ImportDrawer } from '@/components/library/ImportDrawer'
import { LibraryFilterDrawer } from '@/components/library/LibraryFilterDrawer'
import { LibraryItem } from '@/components/library/LibraryItem'
import { SelectionBar } from '@/components/library/SelectionBar'
import { ShelfChips } from '@/components/library/ShelfChips'
import { SortableWantList } from '@/components/library/SortableWantList'
import { TopBar } from '@/components/layout/TopBar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  applyLibraryFilter,
  booksOnShelf,
  countLibraryFilter,
  defaultSort,
  EMPTY_LIBRARY_FILTER,
  readYears,
  SHELF_TABS,
  shelfCounts,
  sortBooks,
  sortOptions,
  type LibraryFilter,
  type SortKey,
} from '@/lib/libraryView'
import { searchBooks } from '@/lib/search'
import { cn } from '@/lib/utils'
import { books } from '@/mocks/books'
import { useLibrary } from '@/state/library'
import type { ReadingStatus } from '@/types/library'

const isShelf = (v: string | null): v is ReadingStatus => SHELF_TABS.some((t) => t.value === v)

const topLink =
  'inline-flex min-h-11 min-w-11 items-center justify-center px-2 text-sm font-semibold underline underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'

export function LibraryPage() {
  const [params, setParams] = useSearchParams()
  const entries = useLibrary((s) => s.entries)
  const counts = shelfCounts(entries)
  const [importOpen, setImportOpen] = useState(false)

  const requested = params.get('shelf')
  // Default: Reading if there's anything on it, otherwise Want to read
  const tab: ReadingStatus = isShelf(requested) ? requested : counts.reading > 0 ? 'reading' : 'want'

  return (
    <>
      <TopBar
        title="Library"
        actions={
          <>
            <Link to="/library/journal" className={topLink}>
              Journal
            </Link>
            <button type="button" className={topLink} onClick={() => setImportOpen(true)}>
              Import
            </button>
          </>
        }
      />

      <Tabs value={tab} onValueChange={(v) => setParams({ shelf: v }, { replace: true })} className="gap-0">
        <TabsList variant="line" aria-label="Shelves" className="h-auto w-full justify-between gap-0 relative overflow-x-auto border-b border-border px-1">
          {SHELF_TABS.map((t) => (
            <TabsTrigger
              key={t.value}
              value={t.value}
              className="min-h-11 min-w-11 flex-none gap-1 px-2 text-muted-foreground data-active:font-semibold data-active:text-foreground"
            >
              {t.label}
              <span className="rounded-full bg-muted px-1.5 text-xs text-foreground tabular-nums">{counts[t.value]}</span>
            </TabsTrigger>
          ))}
        </TabsList>
        {SHELF_TABS.map((t) => (
          <TabsContent key={t.value} value={t.value}>
            {/* key: toolbar state resets per shelf */}
            <ShelfPanel key={t.value} tab={t.value} />
          </TabsContent>
        ))}
      </Tabs>

      <ImportDrawer open={importOpen} onOpenChange={setImportOpen} />
    </>
  )
}

const EMPTY: Record<ReadingStatus, { title: string; detail: string; discover: boolean }> = {
  reading: { title: 'Nothing on the go.', detail: 'Your next era is one tap away.', discover: true },
  want: { title: 'Your TBR is empty.', detail: 'Suspicious, but okay.', discover: true },
  read: { title: 'No finished books yet.', detail: 'Everyone starts somewhere.', discover: false },
  dnf: { title: 'No DNFs.', detail: 'You finish what you start. Respect.', discover: false },
}

function ShelfPanel({ tab }: { tab: ReadingStatus }) {
  const entries = useLibrary((s) => s.entries)
  const shelves = useLibrary((s) => s.shelves)
  const wantOrder = useLibrary((s) => s.wantOrder)
  const view = useLibrary((s) => s.libraryView)
  const setView = useLibrary((s) => s.setLibraryView)

  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortKey>(defaultSort(tab))
  const [filter, setFilter] = useState<LibraryFilter>(EMPTY_LIBRARY_FILTER)
  const [shelfId, setShelfId] = useState<string | null>(null)
  const [selecting, setSelecting] = useState(false)
  const [selected, setSelected] = useState<string[]>([])
  const searchId = useId()

  const onShelf = booksOnShelf(books, entries, tab)
  if (onShelf.length === 0) return <EmptyShelf tab={tab} />

  // Pipeline: custom shelf → search → filters → sort
  let list = onShelf
  const shelf = shelves.find((s) => s.id === shelfId)
  if (shelf) list = list.filter((b) => shelf.bookIds.includes(b.id))
  if (query.trim()) {
    const hits = new Set(searchBooks(query, list).results.map((r) => r.book.id))
    list = list.filter((b) => hits.has(b.id))
  }
  list = sortBooks(applyLibraryFilter(list, entries, filter), entries, sort, wantOrder)

  const genres = [...new Set(onShelf.flatMap((b) => b.genres))].sort()
  const activeFilters = countLibraryFilter(filter)
  const sortLabel = sortOptions(tab).find((o) => o.value === sort)?.label
  const reorderable = tab === 'want' && sort === 'my-order' && !selecting

  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  const exitSelection = () => {
    setSelecting(false)
    setSelected([])
  }

  return (
    <div className={cn('space-y-3 pt-3', selecting ? 'pb-36' : 'pb-8')}>
      {/* Toolbar */}
      <div className="space-y-2 px-4">
        <div className="flex items-center gap-1">
        <div className="relative flex-1">
          <label htmlFor={searchId} className="sr-only">
            Search my library
          </label>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input
            id={searchId}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search my library"
            className="min-h-11 w-full rounded-lg border border-muted-foreground bg-card pr-3 pl-9 text-base outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          />
        </div>
          {!selecting && (
            <Button variant="ghost" className="min-h-11 px-2" onClick={() => setSelecting(true)}>
              <ListChecks aria-hidden="true" />
              Select
            </Button>
          )}
        </div>
        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="min-h-11 border-muted-foreground px-2.5">
                <ArrowUpDown aria-hidden="true" />
                <span className="sr-only">Sort: </span>
                {sortLabel}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-44">
              <DropdownMenuLabel className="text-xs text-muted-foreground">Sort by</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={sort} onValueChange={(v) => setSort(v as SortKey)}>
                {sortOptions(tab).map((o) => (
                  <DropdownMenuRadioItem key={o.value} value={o.value} className="min-h-11">
                    {o.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <LibraryFilterDrawer
            value={filter}
            onChange={setFilter}
            genres={genres}
            years={tab === 'read' ? readYears(entries) : null}
            trigger={
              <Button variant="outline" className="min-h-11 border-muted-foreground px-2.5">
                <SlidersHorizontal aria-hidden="true" />
                Filter{activeFilters > 0 && ` · ${activeFilters}`}
              </Button>
            }
          />

          <div role="group" aria-label="Layout" className="ml-auto flex">
            <ViewButton label="Grid view" pressed={view === 'grid'} onClick={() => setView('grid')}>
              <LayoutGrid aria-hidden="true" />
            </ViewButton>
            <ViewButton label="List view" pressed={view === 'list'} onClick={() => setView('list')}>
              <List aria-hidden="true" />
            </ViewButton>
          </div>
        </div>
      </div>

      <ShelfChips value={shelfId} onChange={setShelfId} />

      {/* Content */}
      <div className="px-4">
        {list.length === 0 ? (
          <div className="space-y-2 rounded-xl border border-dashed border-muted-foreground p-4 text-sm">
            <p>
              {query.trim() ? `No books in this shelf match "${query.trim()}".` : 'No books here match these filters.'}
            </p>
            {(activeFilters > 0 || shelfId) && !query.trim() && (
              <Button
                variant="outline"
                className="min-h-11 border-muted-foreground"
                onClick={() => {
                  setFilter(EMPTY_LIBRARY_FILTER)
                  setShelfId(null)
                }}
              >
                Clear filters
              </Button>
            )}
          </div>
        ) : reorderable ? (
          // "My order" is always a list: rows need room for the handle and move buttons
          <SortableWantList books={list} />
        ) : view === 'grid' ? (
          <ul className="grid grid-cols-3 gap-x-3 gap-y-5">
            {list.map((b) => (
              <li key={b.id}>
                <LibraryItem
                  book={b}
                  entry={entries[b.id]}
                  view="grid"
                  selecting={selecting}
                  selected={selected.includes(b.id)}
                  onToggleSelect={() => toggle(b.id)}
                />
              </li>
            ))}
          </ul>
        ) : (
          <ul className="divide-y divide-border">
            {list.map((b) => (
              <li key={b.id}>
                <LibraryItem
                  book={b}
                  entry={entries[b.id]}
                  view="list"
                  selecting={selecting}
                  selected={selected.includes(b.id)}
                  onToggleSelect={() => toggle(b.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      {selecting && <SelectionBar selected={selected} onDone={exitSelection} onCancel={exitSelection} />}
    </div>
  )
}

function ViewButton({ label, pressed, onClick, children }: { label: string; pressed: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        'flex size-11 items-center justify-center rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background [&_svg]:size-5',
        // Pressed = inverted fill (not color alone)
        pressed ? 'border border-muted-foreground bg-secondary text-secondary-foreground' : 'text-foreground hover:bg-muted',
      )}
    >
      {children}
    </button>
  )
}

function EmptyShelf({ tab }: { tab: ReadingStatus }) {
  const copy = EMPTY[tab]
  return (
    <div className="mx-4 mt-4 space-y-1 rounded-xl border border-dashed border-muted-foreground p-4">
      <p className="font-semibold">{copy.title}</p>
      <p className="text-sm text-muted-foreground">{copy.detail}</p>
      {copy.discover && (
        <Link
          to="/discover"
          className="inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Find something on Discover
        </Link>
      )}
    </div>
  )
}
