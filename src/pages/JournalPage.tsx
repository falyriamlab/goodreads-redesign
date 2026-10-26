import { useState } from 'react'
import { JournalEntry } from '@/components/journal/JournalEntry'
import { TopBar } from '@/components/layout/TopBar'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { groupByMonth, monthSummary } from '@/lib/journal'
import { getBookById } from '@/mocks/books'
import { useLibrary } from '@/state/library'
import { SelectedCheck } from '@/components/common/SelectedCheck'

type Filter = 'all' | 'finished' | 'started' | 'dnf'

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'finished', label: 'Finished' },
  { value: 'started', label: 'Started' },
  { value: 'dnf', label: 'DNF' },
]

const toggleOnClass =
  'min-h-11 min-w-11 border-muted-foreground px-3 font-medium group/selected data-[state=on]:border-muted-foreground data-[state=on]:bg-secondary data-[state=on]:font-semibold data-[state=on]:text-secondary-foreground'

export function JournalPage() {
  const history = useLibrary((s) => s.history)
  const entries = useLibrary((s) => s.entries)
  const [filter, setFilter] = useState<Filter>('all')
  const events = filter === 'all' ? history : history.filter((e) => e.type === filter)
  const months = groupByMonth(events)
  const count = (type: Filter) => history.filter((e) => e.type === type).length

  return (
    <>
      <TopBar title="Journal" back backFallback="/library" />
      {history.length > 0 && (
        // Rule 1: the journal summary is this screen's one paper band; its totals are the display numbers
        <section aria-labelledby="journal-totals" className="space-y-4 bg-band px-4 py-6 text-band-foreground">
          <h2 id="journal-totals" className="section-title">
            All time
          </h2>
          <dl className="grid grid-cols-3 gap-2">
            {(
              [
                ['Finished', count('finished')],
                ['Started', count('started')],
                ['DNF', count('dnf')],
              ] as const
            ).map(([label, n]) => (
              <div key={label} className="flex flex-col-reverse">
                <dt className="text-sm text-band-muted-foreground">{label}</dt>
                <dd className="stat-number">{n}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
      <div className="space-y-6 px-4 pt-6 pb-10">
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
                  <SelectedCheck />
                  {f.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>

            {months.length === 0 && (
              <p className="text-sm text-muted-foreground">Nothing here yet for this filter.</p>
            )}

            {months.map((month) => (
              <section key={month.key} aria-labelledby={`month-${month.key}`} className="space-y-4">
                <div className="flex items-baseline justify-between gap-3 border-b border-border pb-1">
                  <h2 id={`month-${month.key}`} className="section-title">
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
