import type { Book } from '@/types/book'
import type { DnfReason, LibraryEntry, ReadingStatus } from '@/types/library'
import { formatShortDate } from './date'

export type SortKey = 'added' | 'read' | 'rating' | 'title' | 'author' | 'my-order'

export const SHELF_TABS: { value: ReadingStatus; label: string }[] = [
  { value: 'reading', label: 'Reading' },
  { value: 'want', label: 'Want to read' },
  { value: 'read', label: 'Read' },
  { value: 'dnf', label: 'DNF' },
]

/** Sort options that make sense on each shelf */
export function sortOptions(tab: ReadingStatus): { value: SortKey; label: string }[] {
  return [
    ...(tab === 'want' ? [{ value: 'my-order' as const, label: 'My order' }] : []),
    { value: 'added', label: 'Date added' },
    ...(tab === 'read' ? [{ value: 'read' as const, label: 'Date read' }] : []),
    { value: 'rating', label: 'Rating' },
    { value: 'title', label: 'Title' },
    { value: 'author', label: 'Author' },
  ]
}

export function defaultSort(tab: ReadingStatus): SortKey {
  if (tab === 'want') return 'my-order'
  if (tab === 'read') return 'read'
  return 'added'
}

export function booksOnShelf(books: Book[], entries: Record<string, LibraryEntry>, tab: ReadingStatus): Book[] {
  return books.filter((b) => entries[b.id]?.status === tab)
}

export function shelfCounts(entries: Record<string, LibraryEntry>): Record<ReadingStatus, number> {
  const counts: Record<ReadingStatus, number> = { reading: 0, want: 0, read: 0, dnf: 0 }
  for (const e of Object.values(entries)) if (e.status) counts[e.status]++
  return counts
}

/** Surname-ish sort key: "Rebecca Yarros" → "yarros rebecca" */
const authorKey = (author: string) => {
  const parts = author.toLowerCase().split(' ')
  return [parts.at(-1), ...parts.slice(0, -1)].join(' ')
}

/** Newest first for dates and ratings; A→Z for title/author; manual order for "My order" */
export function sortBooks(books: Book[], entries: Record<string, LibraryEntry>, sort: SortKey, wantOrder: string[] = []): Book[] {
  const e = (b: Book) => entries[b.id]
  const byDate = (pick: (x: LibraryEntry) => string | null) => (a: Book, b: Book) =>
    (pick(e(b)) ?? '').localeCompare(pick(e(a)) ?? '')
  const comparators: Record<SortKey, (a: Book, b: Book) => number> = {
    added: byDate((x) => x.addedAt),
    read: byDate((x) => x.finishedAt),
    rating: (a, b) => (e(b).rating ?? -1) - (e(a).rating ?? -1),
    title: (a, b) => a.title.localeCompare(b.title),
    author: (a, b) => authorKey(a.author).localeCompare(authorKey(b.author)),
    'my-order': (a, b) => rank(wantOrder, a.id) - rank(wantOrder, b.id),
  }
  return [...books].sort((a, b) => comparators[sort](a, b) || a.title.localeCompare(b.title))
}

const rank = (order: string[], id: string) => {
  const i = order.indexOf(id)
  return i < 0 ? Number.MAX_SAFE_INTEGER : i
}

export type LibraryFilter = {
  genres: string[]
  /** Year finished (Read shelf only) */
  year: number | null
  /** Minimum rating, e.g. 4 = 4 stars and up */
  minRating: number | null
}

export const EMPTY_LIBRARY_FILTER: LibraryFilter = { genres: [], year: null, minRating: null }

export function applyLibraryFilter(books: Book[], entries: Record<string, LibraryEntry>, f: LibraryFilter): Book[] {
  return books.filter((b) => {
    const e = entries[b.id]
    if (f.genres.length && !f.genres.some((g) => b.genres.includes(g))) return false
    if (f.year !== null && !e?.finishedAt?.startsWith(String(f.year))) return false
    if (f.minRating !== null && (e?.rating ?? -1) < f.minRating) return false
    return true
  })
}

export const countLibraryFilter = (f: LibraryFilter) => f.genres.length + (f.year !== null ? 1 : 0) + (f.minRating !== null ? 1 : 0)

export function readYears(entries: Record<string, LibraryEntry>): number[] {
  const years = new Set<number>()
  for (const e of Object.values(entries)) if (e.status === 'read' && e.finishedAt) years.add(Number(e.finishedAt.slice(0, 4)))
  return [...years].sort((a, b) => b - a)
}

const DNF_REASON: Record<DnfReason, string> = {
  'not-for-me': 'Not for me',
  'too-slow': 'Too slow',
  'not-right-time': 'Not the right time',
  content: 'Content',
}

/** "Read Mar 12", "p. 140 · 38%", "Stopped at p. 120 · Too slow", "Added Sep 28" */
export function statusLine(book: Book, entry: LibraryEntry): string {
  switch (entry.status) {
    case 'read':
      return entry.finishedAt ? `Read ${formatShortDate(entry.finishedAt)}` : 'Read'
    case 'reading':
      return `p. ${entry.currentPage} · ${Math.min(100, Math.round((entry.currentPage / book.pages) * 100))}%`
    case 'dnf':
      return [`Stopped at p. ${entry.dnfPage ?? entry.currentPage}`, entry.dnfReason && DNF_REASON[entry.dnfReason]]
        .filter(Boolean)
        .join(' · ')
    default:
      return entry.addedAt ? `Added ${formatShortDate(entry.addedAt)}` : ''
  }
}
