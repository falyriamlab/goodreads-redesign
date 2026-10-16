import { books as catalog } from '@/mocks/books'
import type { Book, Pace } from '@/types/book'
import type { LibraryEntry } from '@/types/library'

export type Taste = {
  genres: string[]
  moods: string[]
  pace: Pace | null
  tropes: string[]
}

export type Recommendation = {
  book: Book
  score: number
  /** Secondary copy shown with the recommendation (the one place recommendation slang lives) */
  reason: string
}

type RecommendInput = {
  entries: Record<string, LibraryEntry>
  dismissed: string[]
  /** "More books with this energy": match against one book */
  base?: Book
  /** "For you": match against the user's onboarding picks */
  user?: { genres: string[]; moods: string[]; pace: Pace }
  limit?: number
  books?: Book[]
}

// Genres say the most about taste; moods, pace and tropes refine it
const WEIGHTS = { genre: 3, mood: 1, pace: 1, trope: 1 }

const overlap = (a: string[], b: string[]) => a.filter((x) => b.includes(x))

function score(book: Book, taste: Taste): number {
  return (
    overlap(book.genres, taste.genres).length * WEIGHTS.genre +
    overlap(book.moods, taste.moods).length * WEIGHTS.mood +
    (taste.pace !== null && book.pace === taste.pace ? WEIGHTS.pace : 0) +
    overlap(book.tropes, taste.tropes).length * WEIGHTS.trope
  )
}

/** Books the user loved (or rated 4.5+): their tropes count as taste */
function lovedBooks(entries: Record<string, LibraryEntry>, books: Book[]): Book[] {
  return books.filter((b) => {
    const e = entries[b.id]
    return e && (e.loved || (e.rating ?? 0) >= 4.5)
  })
}

/** Anything already on a shelf (Want, Reading, Read, DNF) or dismissed is never recommended */
function isExcluded(bookId: string, entries: Record<string, LibraryEntry>, dismissed: string[]): boolean {
  return entries[bookId]?.status != null || dismissed.includes(bookId)
}

export function recommend({ entries, dismissed, base, user, limit = 10, books = catalog }: RecommendInput): Recommendation[] {
  const loved = lovedBooks(entries, books)
  const taste: Taste = base
    ? { genres: base.genres, moods: base.moods, pace: base.pace, tropes: base.tropes }
    : {
        genres: user?.genres ?? [],
        moods: user?.moods ?? [],
        pace: user?.pace ?? null,
        tropes: [...new Set(loved.flatMap((b) => b.tropes))],
      }

  return books
    .filter((b) => b.id !== base?.id && !isExcluded(b.id, entries, dismissed))
    .map((book) => ({ book, score: score(book, taste), reason: reasonFor(book, taste, base, loved) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || a.book.title.localeCompare(b.book.title))
    .slice(0, limit)
}

function reasonFor(book: Book, taste: Taste, base: Book | undefined, loved: Book[]): string {
  if (base) return `Because you loved ${base.title}`
  const genre = overlap(book.genres, taste.genres)[0]
  if (genre) {
    return taste.pace === 'fast' && book.pace === 'fast'
      ? `Because you're in your ${genre} era and love a fast read`
      : `Because you're in your ${genre} era`
  }
  // Otherwise credit the loved book it shares the most with
  const match = loved
    .map((b) => ({ b, n: overlap(b.tropes, book.tropes).length + overlap(b.moods, book.moods).length }))
    .sort((a, b) => b.n - a.n)[0]
  if (match && match.n > 0) return `Because you loved ${match.b.title}`
  return 'Because it matches your vibe'
}
