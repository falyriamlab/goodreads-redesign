import Fuse, { type FuseResultMatch, type IFuseOptions } from 'fuse.js'
import type { Book } from '@/types/book'

/** Lowercase, accents stripped: "Sofía" → "sofia" */
export function normalize(s: string): string {
  return s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim()
}

type SearchKey = 'title' | 'author' | 'series'

export type SearchResult = {
  book: Book
  /** Character ranges to highlight, per field ([start, end] inclusive) */
  highlights: Partial<Record<SearchKey, [number, number][]>>
}

export type SearchOutcome = {
  results: SearchResult[]
  /** Set when the best match doesn't literally contain the query: the title/author we think you meant */
  correctedQuery: string | null
}

const OPTIONS: IFuseOptions<Book> = {
  keys: [
    { name: 'title', weight: 2 },
    { name: 'author', weight: 1.5 },
    { name: 'series', weight: 1 },
  ],
  threshold: 0.35,
  ignoreLocation: true,
  ignoreDiacritics: true,
  includeMatches: true,
  minMatchCharLength: 2,
}

const fieldOf = (book: Book, key: SearchKey) => (key === 'series' ? (book.series ?? '') : book[key])

/** Contiguous ranges where the normalized query appears literally */
function literalRanges(text: string, query: string): [number, number][] {
  const hay = normalize(text)
  const needle = normalize(query)
  if (!needle) return []
  const ranges: [number, number][] = []
  for (let i = hay.indexOf(needle); i >= 0; i = hay.indexOf(needle, i + needle.length)) {
    ranges.push([i, i + needle.length - 1])
  }
  return ranges
}

function highlightsFor(book: Book, query: string, matches: readonly FuseResultMatch[] = []) {
  const out: SearchResult['highlights'] = {}
  for (const key of ['title', 'author', 'series'] as SearchKey[]) {
    const literal = literalRanges(fieldOf(book, key), query)
    if (literal.length) {
      out[key] = literal
      continue
    }
    // Fuzzy: highlight whole words that are a near-miss of a query word ("forth" → "Fourth"),
    // instead of Fuse's character fragments ("rth Wing")
    if (!matches.some((m) => m.key === key)) continue
    const fuzzy = fuzzyWordRanges(fieldOf(book, key), query)
    if (fuzzy.length) out[key] = fuzzy
  }
  return out
}

/** Edit distance (insert/delete/substitute) */
function levenshtein(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, j) => j)
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0]
    row[0] = i
    for (let j = 1; j <= b.length; j++) {
      const tmp = row[j]
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1))
      prev = tmp
    }
  }
  return row[b.length]
}

function fuzzyWordRanges(text: string, query: string): [number, number][] {
  const queryWords = normalize(query).split(/\s+/).filter((w) => w.length >= 2)
  const ranges: [number, number][] = []
  for (const m of text.matchAll(/[\p{L}\p{N}']+/gu)) {
    const word = normalize(m[0])
    const close = queryWords.some((q) => {
      const allowed = Math.max(q.length, word.length) >= 8 ? 2 : 1
      return word.startsWith(q) || levenshtein(word, q) <= allowed
    })
    if (close) ranges.push([m.index, m.index + m[0].length - 1])
  }
  return ranges
}

/** Which field of the best result the query was aiming at (title, author or series) */
function bestField(book: Book, query: string): string {
  let best = { value: book.title, score: Infinity }
  for (const key of ['title', 'author', 'series'] as SearchKey[]) {
    const value = fieldOf(book, key)
    if (!value) continue
    const [hit] = new Fuse([value], { includeScore: true, ignoreLocation: true, ignoreDiacritics: true, threshold: 1 }).search(query)
    if (hit && (hit.score ?? 1) < best.score) best = { value, score: hit.score ?? 1 }
  }
  return best.value
}

const cache = new WeakMap<Book[], Fuse<Book>>()
const fuseFor = (books: Book[]) => {
  let fuse = cache.get(books)
  if (!fuse) cache.set(books, (fuse = new Fuse(books, OPTIONS)))
  return fuse
}

/**
 * Typo-tolerant search over title, author and series.
 * `exact` ("Search for X instead") only returns literal matches.
 */
export function searchBooks(query: string, books: Book[], { exact = false } = {}): SearchOutcome {
  const q = query.trim()
  if (!q) return { results: [], correctedQuery: null }

  if (exact) {
    const needle = normalize(q)
    const results = books
      .filter((b) => (['title', 'author', 'series'] as SearchKey[]).some((k) => normalize(fieldOf(b, k)).includes(needle)))
      .map((book) => ({ book, highlights: highlightsFor(book, q) }))
    return { results, correctedQuery: null }
  }

  const hits = fuseFor(books).search(q)
  const results = hits.map((h) => ({ book: h.item, highlights: highlightsFor(h.item, q, h.matches) }))
  const top = hits[0]?.item
  const literal =
    top && (['title', 'author', 'series'] as SearchKey[]).some((k) => normalize(fieldOf(top, k)).includes(normalize(q)))
  return { results, correctedQuery: top && !literal ? bestField(top, q) : null }
}
