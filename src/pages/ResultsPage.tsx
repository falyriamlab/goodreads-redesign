import { useId, useState } from 'react'
import { X } from 'lucide-react'
import { useSearchParams } from 'react-router'
import { BookCard } from '@/components/book/BookCard'
import { SegmentedRadio } from '@/components/common/SegmentedRadio'
import { TopBar } from '@/components/layout/TopBar'
import { Button } from '@/components/ui/button'
import { activeFilters, filterBooks, filtersFromParams, matchSummary } from '@/lib/filters'
import { score, userTaste } from '@/lib/recommend'
import { books } from '@/mocks/books'
import { currentUser } from '@/mocks/user'
import { useLibrary } from '@/state/library'

type Sort = 'best' | 'shortest'

export function ResultsPage() {
  const [params, setParams] = useSearchParams()
  const [sort, setSort] = useState<Sort>('best')
  const entries = useLibrary((s) => s.entries)
  const sortLabelId = useId()

  const filters = filtersFromParams(params)
  const chips = activeFilters(params)
  const taste = userTaste(entries, {
    genres: currentUser.favoriteGenres,
    moods: currentUser.favoriteMoods,
    pace: currentUser.preferredPace,
  })

  const results = filterBooks(books, filters).sort((a, b) =>
    sort === 'shortest' ? a.pages - b.pages : score(b, taste) - score(a, taste) || a.title.localeCompare(b.title),
  )

  function removeAt(index: number) {
    const next = new URLSearchParams()
    chips.forEach((c, i) => i !== index && next.append(c.param, c.value))
    setParams(next, { replace: true })
  }

  const n = results.length

  return (
    <>
      <TopBar title={`${n} ${n === 1 ? 'book' : 'books'}`} back backFallback={`/discover?${params}`} />
      <div className="space-y-4 pt-3 pb-8">
        {chips.length > 0 && (
          <ul aria-label="Active filters" className="flex gap-2 relative overflow-x-auto px-4 pb-1">
            {chips.map((chip, i) => (
              <li key={`${chip.param}=${chip.value}`} className="shrink-0">
                <button
                  type="button"
                  aria-label={`Remove filter: ${chip.label}`}
                  onClick={() => removeAt(i)}
                  className="inline-flex min-h-11 items-center gap-1 rounded-full border border-foreground bg-foreground px-3.5 text-sm font-semibold text-background outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {chip.label}
                  <X className="size-4" strokeWidth={2.5} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}

        {n === 0 ? (
          <div className="mx-4 space-y-3 rounded-xl border border-dashed border-muted-foreground p-4">
            <p className="text-sm">No books match all of that.</p>
            {chips.length > 0 && (
              <Button variant="outline" className="min-h-11 border-muted-foreground" onClick={() => removeAt(chips.length - 1)}>
                Remove last filter
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="space-y-1.5 px-4">
              <p id={sortLabelId} className="text-sm font-semibold">
                Sort by
              </p>
              <SegmentedRadio
                labelledBy={sortLabelId}
                value={sort}
                onChange={setSort}
                options={[
                  { value: 'best', label: 'Best match' },
                  { value: 'shortest', label: 'Shortest first' },
                ]}
                className="[&>button]:text-sm"
              />
            </div>
            <ul className="grid grid-cols-3 gap-x-3 gap-y-6 px-4 pt-2">
              {results.map((book) => (
                <li key={book.id} className="flex justify-center">
                  <BookCard book={book} caption={matchSummary(book, filters) || undefined} />
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </>
  )
}
