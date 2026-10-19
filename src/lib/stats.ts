import { now as clockNow } from '@/lib/clock'
import { books as catalog } from '@/mocks/books'
import type { Book, Pace } from '@/types/book'
import type { ReadingEvent } from '@/types/library'

export const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export type Share = { label: string; count: number; percent: number }

export type FinishedBook = { book: Book; date: string; rating: number | null }

export type YearStats = {
  year: number
  books: number
  pages: number
  /** Average of rated finishes, null if none are rated */
  avgRating: number | null
  booksPerMonth: number[]
  pagesPerMonth: number[]
  /** Buckets 0.5, 1, …, 5 (a 4.25 counts in the 4 bucket) */
  ratingDistribution: { bucket: number; count: number }[]
  /** % of finished books tagged with each genre (books can have several) */
  topGenres: Share[]
  topMoods: Share[]
  pace: Record<Pace, { count: number; percent: number }>
}

/** Finished (never DNF) events in a year, joined with their books. Each finish counts, rereads included. */
export function finishedInYear(history: ReadingEvent[], year: number, books: Book[] = catalog): FinishedBook[] {
  const byBook = new Map<string, FinishedBook>()
  for (const e of history) {
    if (e.type !== 'finished' || !e.date.startsWith(`${year}-`)) continue
    const book = books.find((b) => b.id === e.bookId)
    if (!book) continue
    const key = `${e.bookId}-${e.date}`
    byBook.set(key, { book, date: e.date, rating: e.rating ?? null })
  }
  return [...byBook.values()].sort((a, b) => a.date.localeCompare(b.date))
}

const pct = (n: number, total: number) => (total === 0 ? 0 : Math.round((n / total) * 100))

function topShares(items: FinishedBook[], pick: (b: Book) => string[], limit = 3): Share[] {
  const counts = new Map<string, number>()
  for (const { book } of items) for (const v of pick(book)) counts.set(v, (counts.get(v) ?? 0) + 1)
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([label, count]) => ({ label, count, percent: pct(count, items.length) }))
}

const average = (values: number[]) =>
  values.length ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100 : null

/** `limit`: how many genres/moods to rank (3 for the profile, more on the Stats page) */
export function yearStats(history: ReadingEvent[], year: number, books: Book[] = catalog, limit = 3): YearStats {
  const finished = finishedInYear(history, year, books)
  const booksPerMonth = Array(12).fill(0) as number[]
  const pagesPerMonth = Array(12).fill(0) as number[]
  for (const f of finished) {
    const m = Number(f.date.slice(5, 7)) - 1
    booksPerMonth[m]++
    pagesPerMonth[m] += f.book.pages
  }

  const ratings = finished.map((f) => f.rating).filter((r): r is number => r !== null)
  const buckets = Array.from({ length: 10 }, (_, i) => (i + 1) / 2)
  const ratingDistribution = buckets.map((bucket) => ({
    bucket,
    count: ratings.filter((r) => Math.max(0.5, Math.floor(r * 2) / 2) === bucket).length,
  }))

  const pace = { slow: 0, medium: 0, fast: 0 }
  for (const f of finished) pace[f.book.pace]++

  return {
    year,
    books: finished.length,
    pages: finished.reduce((sum, f) => sum + f.book.pages, 0),
    avgRating: average(ratings),
    booksPerMonth,
    pagesPerMonth,
    ratingDistribution,
    topGenres: topShares(finished, (b) => b.genres, limit),
    topMoods: topShares(finished, (b) => b.moods, limit),
    pace: {
      slow: { count: pace.slow, percent: pct(pace.slow, finished.length) },
      medium: { count: pace.medium, percent: pct(pace.medium, finished.length) },
      fast: { count: pace.fast, percent: pct(pace.fast, finished.length) },
    },
  }
}

export type MonthStats = {
  /** "2026-10" */
  month: string
  finished: FinishedBook[]
  books: number
  pages: number
  avgRating: number | null
  /** Highest rated finish of the month (latest wins a tie) */
  topRated: FinishedBook | null
}

export function monthStats(history: ReadingEvent[], month: string, books: Book[] = catalog): MonthStats {
  const year = Number(month.slice(0, 4))
  const finished = finishedInYear(history, year, books).filter((f) => f.date.startsWith(month))
  const rated = finished.filter((f) => f.rating !== null)
  const topRated = rated.reduce<FinishedBook | null>(
    (best, f) => (!best || (f.rating ?? 0) > (best.rating ?? 0) || ((f.rating ?? 0) === (best.rating ?? 0) && f.date > best.date) ? f : best),
    null,
  )
  return {
    month,
    finished,
    books: finished.length,
    pages: finished.reduce((s, f) => s + f.book.pages, 0),
    avgRating: average(rated.map((f) => f.rating as number)),
    topRated,
  }
}

/** Years that have at least one finished book, newest first */
export function statYears(history: ReadingEvent[]): number[] {
  return [...new Set(history.filter((e) => e.type === 'finished').map((e) => Number(e.date.slice(0, 4))))].sort((a, b) => b - a)
}

/** Best-rated finishes of the year, for the Year card */
export function topRatedOfYear(history: ReadingEvent[], year: number, limit = 4, books: Book[] = catalog): FinishedBook[] {
  return [...finishedInYear(history, year, books)]
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || b.date.localeCompare(a.date))
    .slice(0, limit)
}

/** Profile's "Share your {Month} recap" link: only when the current month has finished books */
export function currentMonthRecap(history: ReadingEvent[], now = clockNow()): { monthName: string; href: string } | null {
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  if (monthStats(history, month).books === 0) return null
  return { monthName: now.toLocaleDateString('en-US', { month: 'long' }), href: `/share?type=month&month=${month}` }
}
