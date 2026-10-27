import { useId, type ReactNode } from 'react'
import { Award, ChevronRight, ListOrdered, ScanBarcode, Search } from 'lucide-react'
import { Link, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { BookCard } from '@/components/book/BookCard'
import { SegmentedRadio } from '@/components/common/SegmentedRadio'
import { FilterDrawer } from '@/components/discover/FilterDrawer'
import { ToggleChip } from '@/components/discover/ToggleChip'
import { TopBar } from '@/components/layout/TopBar'
import { Button } from '@/components/ui/button'
import {
  capitalize,
  countActive,
  filterBooks,
  filtersFromParams,
  LENGTH_LABEL,
  setGroupParams,
  toggleParam,
  valuesByFrequency,
  type Filters,
  type Length,
} from '@/lib/filters'
import { books } from '@/mocks/books'
import type { Pace } from '@/types/book'

const MOODS = valuesByFrequency(books, (b) => b.moods)
const TROPES = valuesByFrequency(books, (b) => b.tropes)
const TOP_TROPES = TROPES.slice(0, 6)
const GENRES = valuesByFrequency(books, (b) => b.genres)
const WARNINGS = valuesByFrequency(books, (b) => b.contentWarnings)
const LENGTHS: Length[] = ['short', 'medium', 'long']

const linkClass =
  'inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'

export function DiscoverPage() {
  const [params, setParams] = useSearchParams()
  const filters = filtersFromParams(params)
  const n = filterBooks(books, filters).length
  const active = countActive(filters)
  const trending = books.filter((b) => b.trending)

  // Filters live in Discover's own URL (replace: no history spam), so Back from results keeps them
  const update = (next: URLSearchParams) => setParams(next, { replace: true, preventScrollReset: true })
  const toggle = (group: keyof Filters, value: string) => update(toggleParam(params, group, value))
  const setGroup = (group: keyof Filters, values: string[]) => update(setGroupParams(params, group, values))

  const ids = { vibe: useId(), pace: useId(), paceHelp: useId(), tropes: useId(), more: useId() }
  const pace: Pace | 'any' = filters.pace.length === 1 ? filters.pace[0] : 'any'

  return (
    <>
      <TopBar title="Discover" />
      {/* Bottom padding clears the sticky "Show n books" bar */}
      <div className="space-y-10 pt-3 pb-40">
        {/* 2. Search entry + scanner */}
        <div className="flex items-center gap-2 px-4">
          <Link
            to="/discover/search"
            className="flex min-h-11 flex-1 items-center gap-2 rounded-lg border border-muted-foreground bg-card px-3 text-sm text-muted-foreground transition-colors outline-none hover:border-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <Search className="size-4 shrink-0" aria-hidden="true" />
            <span>Books, authors, lists, people</span>
          </Link>
          <Button
            variant="outline"
            size="icon"
            className="size-11 border-muted-foreground [&_svg]:size-5"
            aria-label="Scan a barcode"
            onClick={() => toast('Scanner coming soon.')}
          >
            <ScanBarcode aria-hidden="true" />
          </Button>
        </div>

        {/* 3. Moods */}
        <section aria-labelledby={ids.vibe} className="space-y-4 px-4">
          <h2 id={ids.vibe} className="section-title">
            What's the vibe?
          </h2>
          <div className="flex flex-wrap gap-x-2 gap-y-3">
            {MOODS.map((m) => (
              <ToggleChip key={m} label={capitalize(m)} pressed={filters.moods.includes(m)} onPressedChange={() => toggle('moods', m)} />
            ))}
          </div>
        </section>

        {/* 4. Pacing: a radiogroup, clearer than a 3-stop slider */}
        <section className="space-y-4 px-4">
          <h2 id={ids.pace} className="section-title">
            Pacing
          </h2>
          <p id={ids.paceHelp} className="text-sm text-muted-foreground">
            Slow burn or can't-put-it-down?
          </p>
          <SegmentedRadio
            labelledBy={ids.pace}
            describedBy={ids.paceHelp}
            value={pace}
            onChange={(v) => setGroup('pace', v === 'any' ? [] : [v])}
            options={[
              { value: 'slow', label: 'Slow' },
              { value: 'medium', label: 'Medium' },
              { value: 'fast', label: 'Fast' },
              { value: 'any', label: 'Any' },
            ]}
            className="[&>button]:text-sm"
          />
        </section>

        {/* 5. Tropes */}
        <section aria-labelledby={ids.tropes} className="space-y-4 px-4">
          <div className="flex items-center justify-between gap-3">
            <h2 id={ids.tropes} className="section-title">
              Tropes
            </h2>
            <FilterDrawer
              title="Tropes"
              description="Pick as many as you like."
              searchable
              options={TROPES.map((t) => ({ value: t, label: capitalize(t) }))}
              selected={filters.tropes}
              onToggle={(v) => toggle('tropes', v)}
              onClear={() => setGroup('tropes', [])}
              trigger={
                <button type="button" className={linkClass}>
                  See all<span className="sr-only"> tropes</span>
                </button>
              }
            />
          </div>
          <div className="flex flex-wrap gap-x-2 gap-y-3">
            {/* Top 6, plus any picked from the drawer so they stay visible */}
            {[...new Set([...TOP_TROPES, ...filters.tropes])].map((t) => (
              <ToggleChip key={t} label={capitalize(t)} pressed={filters.tropes.includes(t)} onPressedChange={() => toggle('tropes', t)} />
            ))}
          </div>
        </section>

        {/* 6. Genre, Length, Content warnings */}
        <section aria-labelledby={ids.more} className="space-y-4 px-4">
          <h2 id={ids.more} className="sr-only">
            More filters
          </h2>
          <ul className="divide-y divide-border rounded-lg border border-border">
            <li>
              <FilterDrawer
                title="Genre"
                description="Show books in any of these genres."
                options={GENRES.map((g) => ({ value: g, label: g }))}
                selected={filters.genres}
                onToggle={(v) => toggle('genres', v)}
                onClear={() => setGroup('genres', [])}
                trigger={<FilterRow label="Genre" value={filters.genres.join(', ')} />}
              />
            </li>
            <li>
              <FilterDrawer
                title="Length"
                description="Page counts vary by edition."
                options={LENGTHS.map((l) => ({ value: l, label: LENGTH_LABEL[l] }))}
                selected={filters.length}
                onToggle={(v) => toggle('length', v)}
                onClear={() => setGroup('length', [])}
                trigger={<FilterRow label="Length" value={filters.length.map(capitalize).join(', ')} />}
              />
            </li>
            <li>
              <FilterDrawer
                title="Content warnings"
                description="Hide books with…"
                options={WARNINGS.map((w) => ({ value: w, label: capitalize(w) }))}
                selected={filters.exclude}
                onToggle={(v) => toggle('exclude', v)}
                onClear={() => setGroup('exclude', [])}
                trigger={
                  <FilterRow
                    label="Content warnings"
                    value={filters.exclude.length ? `Hiding ${filters.exclude.join(', ')}` : ''}
                  />
                }
              />
            </li>
          </ul>
        </section>

        {/* 8. Trending */}
        <Carousel title="Trending this week">
          {trending.map((b) => (
            <li key={b.id} className="shrink-0">
              <BookCard book={b} />
            </li>
          ))}
        </Carousel>

        {/* 9. Lists & awards */}
        <section className="space-y-4 px-4">
          <h2 className="section-title">Lists & awards</h2>
          <div className="grid grid-cols-2 gap-3">
            <ListCard icon={<ListOrdered aria-hidden="true" />} title="Listopia" detail="Lists made by readers" />
            <ListCard icon={<Award aria-hidden="true" />} title="Choice Awards" detail="Voted by the community" />
          </div>
        </section>
      </div>

      {/* 7. Sticky results button, above the bottom nav */}
      <div className="fixed inset-x-0 bottom-[calc(3.5rem+1px+env(safe-area-inset-bottom))] z-30 mx-auto w-full max-w-app border-t border-border bg-background/95 px-4 pt-3 pb-2 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        {n > 0 ? (
          <Button asChild size="lg" className="min-h-11 w-full">
            <Link to={`/discover/results?${params}`}>Show {n} books</Link>
          </Button>
        ) : (
          <Button size="lg" className="min-h-11 w-full" disabled aria-describedby="no-matches">
            Show 0 books
          </Button>
        )}
        <div className="flex min-h-11 items-center justify-between gap-3">
          <p id="no-matches" aria-live="polite" className="text-sm text-muted-foreground">
            {n === 0 ? 'No matches yet. Try loosening them up.' : active > 0 ? `${active} ${active === 1 ? 'filter' : 'filters'} on` : ''}
          </p>
          {active > 0 && (
            <button type="button" className={linkClass} onClick={() => update(new URLSearchParams())}>
              Clear all
            </button>
          )}
        </div>
      </div>
    </>
  )
}

function FilterRow({ label, value, ...props }: { label: string; value: string }) {
  return (
    <button
      type="button"
      {...props}
      className="flex min-h-14 w-full items-center gap-3 px-3 text-left outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
    >
      <span className="flex-1">
        <span className="block text-sm font-semibold">{label}</span>
        <span className="block truncate text-xs text-muted-foreground">{value || 'Any'}</span>
      </span>
      <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
    </button>
  )
}

function Carousel({ title, children }: { title: string; children: ReactNode }) {
  const id = useId()
  return (
    <section aria-labelledby={id} className="space-y-4">
      <h2 id={id} className="px-4 section-title">
        {title}
      </h2>
      <ul className="flex gap-4 relative overflow-x-auto px-4 pb-2">{children}</ul>
    </section>
  )
}

function ListCard({ icon, title, detail }: { icon: ReactNode; title: string; detail: string }) {
  return (
    <button
      type="button"
      onClick={() => toast('Lists drop soon.')}
      className="flex min-h-24 flex-col items-start justify-between gap-2 rounded-xl border border-border bg-card p-3 text-left text-card-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background [&_svg]:size-5"
    >
      {icon}
      <span>
        <span className="block text-sm font-semibold">{title}</span>
        <span className="block text-xs text-muted-foreground">{detail}</span>
      </span>
    </button>
  )
}
