import { useState } from 'react'
import { JournalEntry } from '@/components/journal/JournalEntry'
import { TopBar } from '@/components/layout/TopBar'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { groupByMonth, monthSummary } from '@/lib/journal'
import { getBookById } from '@/mocks/books'
import { useLibrary } from '@/state/library'

type Filter = 'all' | 'finished' | 'started' | 'dnf'

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'finished', label: 'Finished' },
  { value: 'started', label: 'Started' },
  { value: 'dnf', label: 'DNF' },
]

const toggleOnClass =
  'min-h-11 min-w-11 border-muted-foreground px-3 font-medium data-[state=on]:border-foreground data-[state=on]:bg-foreground data-[state=on]:font-semibold data-[state=on]:text-background'

export function JournalPage() {
  const history = useLibrary((s) => s.history)
  const entries = useLibrary((s) => s.entries)
  const [filter, setFilter] = useState<Filter>('all')
  const events = filter === 'all' ? history : history.filter((e) => e.type === filter)
  const months = groupByMonth(events)

  return (
    <>
      <TopBar title="Journal" back backFallback="/library" />
      <div className="space-y-6 px-4 pt-3 pb-8">
        {history.length === 0 ? (
          <div className="space-y-1 rounded-xl border border-dashed border-muted-foreground p-4">
            <p className="font-semibold">Your journal is empty.</p>
            <p className="text-sm text-muted-foreground">Log a book and it shows up here.</p>
          </div>
        ) : (
          <>
            <ToggleGroup
              type="single"
              variant="outline"
              aria-label="Show"
              value={filter}
              // Single select that can't be emptied: ignore deselecting the active item
              onValueChange={(v) => v && setFilter(v as Filter)}
              className="flex w-full flex-wrap"
            >
              {FILTERS.map((f) => (
                <ToggleGroupItem key={f.value} value={f.value} className={toggleOnClass}>
                  {f.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>

            {months.length === 0 && (
              <p className="text-sm text-muted-foreground">Nothing here yet for this filter.</p>
            )}

            {months.map((month) => (
              <section key={month.key} aria-labelledby={`month-${month.key}`} className="space-y-2">
                <div className="flex items-baseline justify-between gap-3 border-b border-border pb-1">
                  <h2 id={`month-${month.key}`} className="text-lg font-bold tracking-tight">
                    {month.label}
                  </h2>
                  <p className="text-sm text-muted-foreground">{monthSummary(month)}</p>
                </div>
                <ul className="divide-y divide-border">
                  {month.events.map((event) => {
                    const book = getBookById(event.bookId)
                    return book ? (
                      <li key={event.id}>
                        <JournalEntry event={event} book={book} loved={entries[book.id]?.loved ?? false} />
                      </li>
                    ) : null
                  })}
                </ul>
              </section>
            ))}
          </>
        )}
      </div>
    </>
  )
}
