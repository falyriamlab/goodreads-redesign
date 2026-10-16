import type { Book, Pace } from '@/types/book'

export type Length = 'short' | 'medium' | 'long'

export type Filters = {
  moods: string[]
  pace: Pace[]
  tropes: string[]
  genres: string[]
  length: Length[]
  /** Content warnings to hide */
  exclude: string[]
}

export const EMPTY_FILTERS: Filters = { moods: [], pace: [], tropes: [], genres: [], length: [], exclude: [] }

/** URL param name for each group: ?mood=dark&mood=tense&pace=fast&trope=…&genre=…&length=…&exclude=… */
export const PARAM: Record<keyof Filters, string> = {
  moods: 'mood',
  pace: 'pace',
  tropes: 'trope',
  genres: 'genre',
  length: 'length',
  exclude: 'exclude',
}
const GROUP_BY_PARAM = Object.fromEntries(Object.entries(PARAM).map(([g, p]) => [p, g])) as Record<string, keyof Filters>

const PACES: Pace[] = ['slow', 'medium', 'fast']
const LENGTHS: Length[] = ['short', 'medium', 'long']

/** short < 300 pages, medium 300–450, long > 450 */
export function lengthOf(pages: number): Length {
  if (pages < 300) return 'short'
  if (pages <= 450) return 'medium'
  return 'long'
}

export const LENGTH_LABEL: Record<Length, string> = {
  short: 'Short (under 300 pages)',
  medium: 'Medium (300–450 pages)',
  long: 'Long (over 450 pages)',
}

const anyOf = (selected: string[], values: string[]) => selected.length === 0 || selected.some((s) => values.includes(s))

/** OR within a group, AND across groups; excluded warnings knock a book out */
export function matchesFilters(book: Book, f: Filters): boolean {
  return (
    anyOf(f.moods, book.moods) &&
    anyOf(f.pace, [book.pace]) &&
    anyOf(f.tropes, book.tropes) &&
    anyOf(f.genres, book.genres) &&
    anyOf(f.length, [lengthOf(book.pages)]) &&
    !f.exclude.some((w) => book.contentWarnings.includes(w))
  )
}

export function filterBooks(books: Book[], f: Filters): Book[] {
  return books.filter((b) => matchesFilters(b, f))
}

export function countActive(f: Filters): number {
  return Object.values(f).reduce((n, values) => n + values.length, 0)
}

/* ---------- URL sync ---------- */

export function filtersFromParams(params: URLSearchParams): Filters {
  const f: Filters = { moods: [], pace: [], tropes: [], genres: [], length: [], exclude: [] }
  for (const [key, value] of params) {
    const group = GROUP_BY_PARAM[key]
    if (!group || !value) continue
    if (group === 'pace' && !PACES.includes(value as Pace)) continue
    if (group === 'length' && !LENGTHS.includes(value as Length)) continue
    const list = f[group] as string[]
    if (!list.includes(value)) list.push(value)
  }
  return f
}

export function filtersToParams(f: Filters): URLSearchParams {
  const params = new URLSearchParams()
  for (const group of Object.keys(PARAM) as (keyof Filters)[]) {
    for (const value of f[group]) params.append(PARAM[group], value)
  }
  return params
}

/** Toggle one value in a group (immutably) */
export function toggleValue(f: Filters, group: keyof Filters, value: string): Filters {
  const list = f[group] as string[]
  return { ...f, [group]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value] }
}

/* ---------- Labels ---------- */

export const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

export type ActiveFilter = { group: keyof Filters; param: string; value: string; label: string }

export function filterLabel(group: keyof Filters, value: string): string {
  if (group === 'length') return capitalize(value)
  if (group === 'exclude') return `No ${value}`
  return capitalize(value)
}

/** Active filters in URL order (so "Remove last filter" removes the one added last) */
export function activeFilters(params: URLSearchParams): ActiveFilter[] {
  const valid = filtersFromParams(params)
  const seen = new Set<string>()
  const out: ActiveFilter[] = []
  for (const [param, value] of params) {
    const group = GROUP_BY_PARAM[param]
    const key = `${param}=${value}`
    if (!group || seen.has(key) || !(valid[group] as string[]).includes(value)) continue
    seen.add(key)
    out.push({ group, param, value, label: filterLabel(group, value) })
  }
  return out
}

/** "Dark · Fast · Enemies to lovers": why a book matched the active filters */
export function matchSummary(book: Book, f: Filters): string {
  const parts = [
    ...f.moods.filter((m) => book.moods.includes(m)),
    ...f.pace.filter((p) => book.pace === p),
    ...f.tropes.filter((t) => book.tropes.includes(t)),
    ...f.genres.filter((g) => book.genres.includes(g)),
    ...f.length.filter((l) => lengthOf(book.pages) === l),
  ]
  return parts.map(capitalize).join(' · ')
}

/** All distinct values of a field across the catalog, most common first */
export function valuesByFrequency(books: Book[], pick: (b: Book) => string[]): string[] {
  const counts = new Map<string, number>()
  for (const b of books) for (const v of pick(b)) counts.set(v, (counts.get(v) ?? 0) + 1)
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([v]) => v)
}

/* ---------- Order-preserving URL edits (so "last filter" means the one added last) ---------- */

/** Adds the value to the end, or removes just that value */
export function toggleParam(params: URLSearchParams, group: keyof Filters, value: string): URLSearchParams {
  const key = PARAM[group]
  const has = params.getAll(key).includes(value)
  const next = new URLSearchParams()
  for (const [k, v] of params) if (!(has && k === key && v === value)) next.append(k, v)
  if (!has) next.append(key, value)
  return next
}

/** Replaces a whole group, appending the new values at the end */
export function setGroupParams(params: URLSearchParams, group: keyof Filters, values: string[]): URLSearchParams {
  const key = PARAM[group]
  const next = new URLSearchParams()
  for (const [k, v] of params) if (k !== key) next.append(k, v)
  for (const v of values) next.append(key, v)
  return next
}
