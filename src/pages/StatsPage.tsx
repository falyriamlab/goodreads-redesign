import { useId, useState } from 'react'
import { Link } from 'react-router'
import { TopBar } from '@/components/layout/TopBar'
import { ChartCard } from '@/components/stats/ChartCard'
import { detailNote } from '@/lib/challenge'
import { capitalize } from '@/lib/filters'
import { formatRating } from '@/lib/rating'
import { MONTHS_SHORT, statYears, yearStats } from '@/lib/stats'
import { books } from '@/mocks/books'
import { currentUser } from '@/mocks/user'
import { useChallengeProgress, useLibrary } from '@/state/library'

const MONTHS_LONG = MONTHS_SHORT.map((_, i) => new Date(2026, i, 1).toLocaleDateString('en-US', { month: 'long' }))
const compact = (n: number) => (n >= 1000 ? `${Math.round(n / 100) / 10}k` : String(n))

export function StatsPage() {
  const history = useLibrary((s) => s.history)
  const years = [...new Set([currentUser.challenge.year, ...statYears(history)])].sort((a, b) => b - a)
  const [year, setYear] = useState(years[0])
  const yearId = useId()
  const s = yearStats(history, year, books, 6)
  const challenge = useChallengeProgress()
  // Count-only imports have no books attached, so they only show up in the challenge total
  const note = detailNote(s.books, year === challenge.year ? challenge.countOnly : 0)

  return (
    <>
      <TopBar title="Stats" back backFallback="/profile" />
      <div className="space-y-4 px-4 pt-3 pb-8">
        <div className="flex items-center gap-3">
          <label htmlFor={yearId} className="text-sm font-semibold">
            Year
          </label>
          <select
            id={yearId}
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="min-h-11 rounded-lg border border-muted-foreground bg-card px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        {s.books === 0 ? (
          <div className="space-y-1 rounded-xl border border-dashed border-muted-foreground p-4">
            <p className="font-semibold">No stats yet.</p>
            <p className="text-sm text-muted-foreground">Finish a book and the numbers start talking.</p>
            <Link to="/library" className="inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4">
              Go to your library
            </Link>
          </div>
        ) : (
          <>
            {/* Stat-number place #1 (the only one on this screen): books; pages and rating are 24px bold */}
            <dl className="grid grid-cols-2 gap-4 rounded-xl border border-border bg-card p-4 text-card-foreground">
              <div className="col-span-2 flex flex-col-reverse">
                <dt className="text-sm text-muted-foreground">Books finished</dt>
                <dd className="stat-number">{s.books}</dd>
              </div>
              <Big label="Pages" value={s.pages.toLocaleString('en-US')} />
              <Big label="Avg rating" value={s.avgRating === null ? '–' : formatRating(s.avgRating)} />
            </dl>
            <p className="text-xs text-muted-foreground">
              Counts finished books from your journal. DNFs aren't included.
            </p>

            <ChartCard
              title="Books per month"
              kind="columns"
              columns={['Month', 'Books']}
              data={s.booksPerMonth.map((value, i) => ({ label: MONTHS_SHORT[i], fullLabel: MONTHS_LONG[i], value }))}
            />
            <ChartCard
              title="Pages per month"
              kind="columns"
              columns={['Month', 'Pages']}
              data={s.pagesPerMonth.map((value, i) => ({
                label: MONTHS_SHORT[i],
                fullLabel: MONTHS_LONG[i],
                value,
                display: compact(value),
              }))}
            />
            <ChartCard
              title="Ratings"
              kind="columns"
              columns={['Stars', 'Books']}
              data={s.ratingDistribution.map((d) => ({
                label: formatRating(d.bucket),
                fullLabel: `${formatRating(d.bucket)} stars`,
                value: d.count,
              }))}
            />
            <ChartCard
              title="Genres"
              kind="bars"
              columns={['Genre', 'Share of books']}
              data={s.topGenres.map((g) => ({ label: g.label, value: g.percent, display: `${g.percent}% · ${g.count}` }))}
            />
            <ChartCard
              title="Moods"
              kind="bars"
              columns={['Mood', 'Share of books']}
              data={s.topMoods.map((m) => ({ label: capitalize(m.label), value: m.percent, display: `${m.percent}% · ${m.count}` }))}
            />
            <ChartCard
              title="Pace"
              kind="bars"
              columns={['Pace', 'Share of books']}
              data={(['slow', 'medium', 'fast'] as const).map((p) => ({
                label: capitalize(p),
                value: s.pace[p].percent,
                display: `${s.pace[p].percent}% · ${s.pace[p].count}`,
              }))}
            />
            <p className="text-xs text-muted-foreground">{note}</p>
          </>
        )}
      </div>
    </>
  )
}

function Big({ label, value }: { label: string; value: string }) {
  return (
    // dt first in the DOM; flex-col-reverse shows the number on top
    <div className="flex flex-col-reverse">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-2xl leading-none font-bold tabular-nums">{value}</dd>
    </div>
  )
}
