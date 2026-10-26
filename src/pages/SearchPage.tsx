import { useEffect, useId, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { Clock, Search, X } from 'lucide-react'
import { Link } from 'react-router'
import { BookCard } from '@/components/book/BookCard'
import { Highlight } from '@/components/common/Highlight'
import { TopBar } from '@/components/layout/TopBar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { searchBooks, type SearchResult } from '@/lib/search'
import { books } from '@/mocks/books'
import { useLibrary } from '@/state/library'

const DEBOUNCE_MS = 150

const TABS = [
  { value: 'all', label: 'All' },
  { value: 'books', label: 'Books' },
  { value: 'authors', label: 'Authors' },
  { value: 'lists', label: 'Lists' },
  { value: 'people', label: 'People' },
] as const

const linkButton =
  'inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/50'

export function SearchPage() {
  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')
  // "Search for X instead": literal matches only, no typo correction
  const [exact, setExact] = useState(false)
  const [tab, setTab] = useState<(typeof TABS)[number]['value']>('all')
  const inputRef = useRef<HTMLInputElement>(null)
  const inputId = useId()

  const recent = useLibrary((s) => s.recentSearches)
  const addRecent = useLibrary((s) => s.addRecentSearch)
  const removeRecent = useLibrary((s) => s.removeRecentSearch)
  const clearRecent = useLibrary((s) => s.clearRecentSearches)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query), DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [query])

  const { results, correctedQuery } = useMemo(() => searchBooks(debounced, books, { exact }), [debounced, exact])
  const hasQuery = debounced.trim() !== ''

  function change(value: string) {
    setQuery(value)
    setExact(false)
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape' && query) {
      e.preventDefault()
      change('')
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    setDebounced(query)
    addRecent(query)
  }

  const save = () => addRecent(query)

  return (
    <>
      <TopBar back backFallback="/discover" />
      <h1 className="sr-only">Search</h1>

      <form role="search" onSubmit={onSubmit} className="flex items-center gap-2 px-4 pt-3">
        <div className="relative flex-1">
          <label htmlFor={inputId} className="sr-only">
            Search books, authors and series
          </label>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input
            ref={inputRef}
            id={inputId}
            type="search"
            // The whole point of this screen is typing: focus on arrival
            autoFocus
            enterKeyHint="search"
            autoComplete="off"
            value={query}
            onChange={(e) => change(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Books, authors, lists, people"
            className="min-h-11 w-full rounded-lg border border-muted-foreground bg-card pr-11 pl-9 text-base outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 [&::-webkit-search-cancel-button]:appearance-none"
          />
          {query && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => {
                change('')
                inputRef.current?.focus()
              }}
              className="absolute top-0 right-0 flex size-11 items-center justify-center rounded-lg text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          )}
        </div>
        <Link to="/discover" className="inline-flex min-h-11 items-center px-1 text-sm font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
          Cancel
        </Link>
      </form>

      {/* Announces result counts politely as you type */}
      <p aria-live="polite" className="sr-only">
        {hasQuery ? `${results.length} ${results.length === 1 ? 'result' : 'results'}` : ''}
      </p>

      {!hasQuery ? (
        <RecentSearches
          items={recent}
          onPick={(q) => {
            change(q)
            setDebounced(q)
            addRecent(q)
            inputRef.current?.focus()
          }}
          onRemove={removeRecent}
          onClear={clearRecent}
        />
      ) : (
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="pt-3">
          <TabsList variant="line" aria-label="Result type" className="h-auto w-full justify-start gap-1 relative overflow-x-auto border-b border-border px-4">
            {TABS.map((t) => (
              <TabsTrigger
                key={t.value}
                value={t.value}
                className="min-h-11 min-w-11 flex-none px-3 text-muted-foreground data-active:font-semibold data-active:text-foreground"
              >
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="px-4 pt-3 pb-8">
            {correctedQuery && (tab === 'all' || tab === 'books' || tab === 'authors') && (
              <div className="mb-3 rounded-lg bg-muted p-3 text-sm">
                <p>
                  Showing results for <strong>{correctedQuery}</strong>. We got you.
                </p>
                <button type="button" className={linkButton} onClick={() => setExact(true)}>
                  Search for "{debounced}" instead
                </button>
              </div>
            )}

            <TabsContent value="all">
              <BookResults results={results} query={debounced} onOpen={save} />
            </TabsContent>
            <TabsContent value="books">
              <BookResults results={results} query={debounced} onOpen={save} />
            </TabsContent>
            <TabsContent value="authors">
              <AuthorResults results={results} query={debounced} onOpen={save} />
            </TabsContent>
            <TabsContent value="lists">
              <p className="py-4 text-sm text-muted-foreground">Coming soon.</p>
            </TabsContent>
            <TabsContent value="people">
              <p className="py-4 text-sm text-muted-foreground">Coming soon.</p>
            </TabsContent>
          </div>
        </Tabs>
      )}
    </>
  )
}

function NoResults({ query }: { query: string }) {
  return (
    <p className="py-4 text-sm">
      No results for "{query}". Check the spelling or try the author's name.
    </p>
  )
}

function BookResults({ results, query, onOpen }: { results: SearchResult[]; query: string; onOpen: () => void }) {
  if (results.length === 0) return <NoResults query={query} />
  return (
    <ul className="divide-y divide-border">
      {results.map(({ book, highlights }) => (
        <li key={book.id}>
          <BookCard
            book={book}
            variant="row"
            onOpen={onOpen}
            titleContent={<Highlight text={book.title} ranges={highlights.title} />}
            authorContent={<Highlight text={book.author} ranges={highlights.author} />}
          />
        </li>
      ))}
    </ul>
  )
}

function AuthorResults({ results, query, onOpen }: { results: SearchResult[]; query: string; onOpen: () => void }) {
  if (results.length === 0) return <NoResults query={query} />
  // Group by author, in order of each author's best-ranked book
  const groups = new Map<string, SearchResult[]>()
  for (const r of results) groups.set(r.book.author, [...(groups.get(r.book.author) ?? []), r])

  return (
    <div className="space-y-6">
      {[...groups.entries()].map(([author, items]) => (
        <section key={author}>
          <h2 className="section-title">
            <Highlight text={author} ranges={items[0].highlights.author} />
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              {items.length} {items.length === 1 ? 'book' : 'books'}
            </span>
          </h2>
          <ul className="divide-y divide-border">
            {items.map(({ book, highlights }) => (
              <li key={book.id}>
                <BookCard
                  book={book}
                  variant="row"
                  onOpen={onOpen}
                  titleContent={<Highlight text={book.title} ranges={highlights.title} />}
                />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

function RecentSearches({
  items,
  onPick,
  onRemove,
  onClear,
}: {
  items: string[]
  onPick: (q: string) => void
  onRemove: (q: string) => void
  onClear: () => void
}) {
  const headingId = useId()
  if (items.length === 0) {
    return <p className="px-4 pt-6 text-sm text-muted-foreground">Search by title, author or series. Typos welcome.</p>
  }
  return (
    <section aria-labelledby={headingId} className="px-4 pt-4">
      <div className="flex items-center justify-between">
        <h2 id={headingId} className="section-title">
          Recent searches
        </h2>
        <button type="button" className={linkButton} onClick={onClear}>
          Clear all<span className="sr-only"> recent searches</span>
        </button>
      </div>
      <ul className="divide-y divide-border">
        {items.map((q) => (
          <li key={q} className="flex items-center">
            <button
              type="button"
              onClick={() => onPick(q)}
              className="flex min-h-11 flex-1 items-center gap-3 text-left text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <Clock className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              {q}
            </button>
            <button
              type="button"
              aria-label={`Remove "${q}" from recent searches`}
              onClick={() => onRemove(q)}
              className="flex size-11 items-center justify-center text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
