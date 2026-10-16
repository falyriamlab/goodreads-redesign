import Fuse from 'fuse.js'
import Papa from 'papaparse'
import type { Book } from '@/types/book'
import type { LibraryEntry, ReadingStatus } from '@/types/library'
import type { ImportItem } from '@/state/library'
import { normalize } from './search'

export type ImportFormat = 'goodreads' | 'storygraph'

/** One row from either export, normalized */
export type ImportRow = {
  title: string
  author: string
  isbn13: string | null
  rating: number | null
  status: ReadingStatus
  /** ISO date */
  dateRead: string | null
}

export type ParsedImport = { format: ImportFormat | null; rows: ImportRow[] }

const GOODREADS_SHELF: Record<string, ReadingStatus> = {
  read: 'read',
  'currently-reading': 'reading',
  'to-read': 'want',
  'did-not-finish': 'dnf',
  dnf: 'dnf',
}

const STORYGRAPH_STATUS: Record<string, ReadingStatus> = {
  read: 'read',
  'currently-reading': 'reading',
  'to-read': 'want',
  'did-not-finish': 'dnf',
}

/** Goodreads wraps ISBNs as ="9780…"; StoryGraph's ISBN/UID can be a non-ISBN id */
function cleanIsbn(raw: string | undefined): string | null {
  const digits = (raw ?? '').replace(/\D/g, '')
  return digits.length === 13 ? digits : null
}

/** Goodreads appends the series to titles: "Red Rising (Red Rising Saga #1)" → "Red Rising" */
function cleanTitle(raw: string | undefined): string {
  return (raw ?? '').replace(/\s*\([^()]*#\s*[\d.]+[^()]*\)\s*$/, '').trim()
}

/** "2026/03/12" or "2026-03-12" → "2026-03-12" */
function cleanDate(raw: string | undefined): string | null {
  const m = (raw ?? '').trim().match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/)
  return m ? `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}` : null
}

function cleanRating(raw: string | undefined): number | null {
  const n = Number((raw ?? '').trim())
  // Goodreads uses 0 for "not rated"
  return Number.isFinite(n) && n > 0 ? Math.min(5, n) : null
}

/** Parses a Goodreads or StoryGraph CSV export */
export function parseLibraryCsv(text: string): ParsedImport {
  const { data, meta } = Papa.parse<Record<string, string>>(text.replace(/^﻿/, ''), {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  })
  const fields = meta.fields ?? []
  const format: ImportFormat | null = fields.includes('Exclusive Shelf')
    ? 'goodreads'
    : fields.includes('Read Status')
      ? 'storygraph'
      : null
  if (!format) return { format, rows: [] }

  const rows = data
    .map((r): ImportRow | null => {
      const title = cleanTitle(r.Title)
      if (!title) return null
      if (format === 'goodreads') {
        return {
          title,
          author: (r.Author ?? '').trim(),
          isbn13: cleanIsbn(r.ISBN13),
          rating: cleanRating(r['My Rating']),
          status: GOODREADS_SHELF[(r['Exclusive Shelf'] ?? '').trim().toLowerCase()] ?? 'want',
          dateRead: cleanDate(r['Date Read']),
        }
      }
      return {
        title,
        // StoryGraph lists co-authors comma-separated; the first one is enough to match
        author: (r.Authors ?? '').split(',')[0].trim(),
        isbn13: cleanIsbn(r['ISBN/UID']),
        rating: cleanRating(r['Star Rating']),
        status: STORYGRAPH_STATUS[(r['Read Status'] ?? '').trim().toLowerCase()] ?? 'want',
        dateRead: cleanDate(r['Last Date Read']),
      }
    })
    .filter((r): r is ImportRow => r !== null)

  return { format, rows }
}

export type MatchedRow = { row: ImportRow; book: Book; by: 'isbn' | 'title' }

/** Authors "match" when they share a name of 3+ letters (handles initials and middle names) */
function sameAuthor(a: string, b: string): boolean {
  const words = (s: string) => normalize(s).split(/[^a-z]+/).filter((w) => w.length >= 3)
  const bw = words(b)
  return words(a).some((w) => bw.includes(w))
}

/** ISBN-13 first; otherwise fuzzy title + same author. One row per book (first wins). */
export function matchRows(rows: ImportRow[], books: Book[]): { matched: MatchedRow[]; unmatched: ImportRow[] } {
  const fuse = new Fuse(books, { keys: ['title'], threshold: 0.3, ignoreDiacritics: true, ignoreLocation: true })
  const matched: MatchedRow[] = []
  const unmatched: ImportRow[] = []
  const seen = new Set<string>()

  for (const row of rows) {
    let hit: MatchedRow | null = null
    const byIsbn = row.isbn13 ? books.find((b) => b.isbn13 === row.isbn13) : undefined
    if (byIsbn) hit = { row, book: byIsbn, by: 'isbn' }
    else {
      const candidate = fuse.search(row.title).find((r) => sameAuthor(r.item.author, row.author))
      if (candidate) hit = { row, book: candidate.item, by: 'title' }
    }
    if (hit && !seen.has(hit.book.id)) {
      seen.add(hit.book.id)
      matched.push(hit)
    } else if (!hit) {
      unmatched.push(row)
    }
  }
  return { matched, unmatched }
}

export type ConflictPolicy = 'keep' | 'use'

export type PlannedImport = MatchedRow & {
  /** What's already in the library for this book, if anything */
  existing: LibraryEntry | null
  /** Whether this row will be written */
  apply: boolean
}

/** Decides what each matched row does, given the conflict policy */
export function planImport(matched: MatchedRow[], entries: Record<string, LibraryEntry>, policy: ConflictPolicy): PlannedImport[] {
  return matched.map((m) => {
    const existing = entries[m.book.id]?.status ? entries[m.book.id] : null
    return { ...m, existing, apply: existing === null || policy === 'use' }
  })
}

export function toImportItems(plan: PlannedImport[]): ImportItem[] {
  return plan
    .filter((p) => p.apply)
    .map((p) => ({ bookId: p.book.id, status: p.row.status, rating: p.row.rating, finishedAt: p.row.dateRead }))
}
