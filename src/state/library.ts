import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { todayISO } from '@/lib/date'
import { normalizeRating } from '@/lib/rating'
import { getBookById } from '@/mocks/books'
import type { DnfReason, LibraryEntry, ReadingStatus } from '@/types/library'

export const EMPTY_ENTRY: LibraryEntry = {
  status: null,
  rating: null,
  loved: false,
  currentPage: 0,
  startedAt: null,
  finishedAt: null,
  rereads: 0,
  everRead: false,
  reviewText: null,
  containsSpoilers: false,
  dnfPage: null,
  dnfReason: null,
}

/**
 * Rule H5: review text is only stored for published books marked Read or DNF.
 */
export function canReview(bookId: string, status: ReadingStatus | null): boolean {
  const book = getBookById(bookId)
  return Boolean(book?.isPublished) && (status === 'read' || status === 'dnf')
}

/** Status change side effects shared by quick changes (chip) and full logs (sheet) */
function applyStatus(entry: LibraryEntry, status: ReadingStatus): LibraryEntry {
  if (entry.status === status) return entry
  if (status === 'reading') {
    // Starting again after finishing counts as a reread
    const isReread = entry.status === 'read'
    return {
      ...entry,
      status,
      startedAt: todayISO(),
      currentPage: isReread ? 0 : entry.currentPage,
      rereads: isReread ? entry.rereads + 1 : entry.rereads,
    }
  }
  if (status === 'read') return { ...entry, status, finishedAt: todayISO(), everRead: true }
  if (status === 'dnf') return { ...entry, status, finishedAt: todayISO() }
  return { ...entry, status }
}

export type LogPayload = {
  status: ReadingStatus
  startedAt: string | null
  finishedAt: string | null
  rating: number | null
  loved: boolean
  reviewText: string
  containsSpoilers: boolean
  dnfPage: number | null
  dnfReason: DnfReason | null
  /** "This is a reread" checkbox */
  isReread: boolean
}

type LibraryState = {
  entries: Record<string, LibraryEntry>
  /** Book ids hidden from recommendations ("Not my vibe") */
  dismissedRecommendations: string[]
  dismiss: (bookId: string) => void
  undoDismiss: (bookId: string) => void
  setStatus: (bookId: string, status: ReadingStatus | null) => void
  setRating: (bookId: string, rating: number | null) => void
  toggleLoved: (bookId: string) => void
  setProgress: (bookId: string, currentPage: number) => void
  /** Applies a full LogSheet save in one update */
  logBook: (bookId: string, payload: LogPayload) => void
  /** Puts back a snapshot (undefined = not shelved). Powers every "Undo". */
  restoreEntry: (bookId: string, entry: LibraryEntry | undefined) => void
}

// Mock seed for Sofía's library (dates are mock data)
export const LIBRARY_SEED: Record<string, LibraryEntry> = {
  'fourth-wing': { ...EMPTY_ENTRY, status: 'reading', currentPage: 312, startedAt: '2026-10-02' },
  'six-of-crows': {
    ...EMPTY_ENTRY,
    status: 'read',
    rating: 4.25,
    everRead: true,
    startedAt: '2026-08-03',
    finishedAt: '2026-08-14',
  },
  'the-song-of-achilles': {
    ...EMPTY_ENTRY,
    status: 'read',
    rating: 5,
    loved: true,
    everRead: true,
    startedAt: '2026-08-20',
    finishedAt: '2026-08-27',
  },
  'book-lovers': {
    ...EMPTY_ENTRY,
    status: 'read',
    rating: 3.5,
    everRead: true,
    startedAt: '2026-09-05',
    finishedAt: '2026-09-11',
  },
  'the-cruel-prince': { ...EMPTY_ENTRY, status: 'reading', currentPage: 140, startedAt: '2026-10-09' },
  'iron-flame': { ...EMPTY_ENTRY, status: 'want' },
  babel: { ...EMPTY_ENTRY, status: 'want' },
  'onyx-storm': { ...EMPTY_ENTRY, status: 'want' },
  'red-white-and-royal-blue': { ...EMPTY_ENTRY, status: 'want' },
  'the-seven-husbands-of-evelyn-hugo': { ...EMPTY_ENTRY, status: 'want' },
}

export const useLibrary = create<LibraryState>()(
  persist(
    (set) => {
      const update = (bookId: string, fn: (entry: LibraryEntry) => LibraryEntry) =>
        set((state) => ({
          entries: { ...state.entries, [bookId]: fn(state.entries[bookId] ?? EMPTY_ENTRY) },
        }))

      const remove = (bookId: string) =>
        set((state) => {
          const { [bookId]: _removed, ...rest } = state.entries
          return { entries: rest }
        })

      return {
        entries: LIBRARY_SEED,
        dismissedRecommendations: [],

        dismiss: (bookId) =>
          set((state) =>
            state.dismissedRecommendations.includes(bookId)
              ? state
              : { dismissedRecommendations: [...state.dismissedRecommendations, bookId] },
          ),

        undoDismiss: (bookId) =>
          set((state) => ({ dismissedRecommendations: state.dismissedRecommendations.filter((id) => id !== bookId) })),

        setStatus: (bookId, status) => {
          // "Remove from shelves": drop the whole entry (callers snapshot it for Undo)
          if (status === null) return remove(bookId)
          update(bookId, (entry) => applyStatus(entry, status))
        },

        setRating: (bookId, rating) =>
          update(bookId, (entry) => ({ ...entry, rating: rating === null ? null : normalizeRating(rating) })),

        toggleLoved: (bookId) => update(bookId, (entry) => ({ ...entry, loved: !entry.loved })),

        setProgress: (bookId, currentPage) =>
          update(bookId, (entry) => {
            const page = Math.max(0, Math.floor(currentPage))
            // Logging progress on an unshelved / want-to-read book means you've started it
            const starting = entry.status === null || entry.status === 'want'
            return {
              ...entry,
              currentPage: page,
              status: starting ? 'reading' : entry.status,
              startedAt: starting ? todayISO() : entry.startedAt,
            }
          }),

        logBook: (bookId, payload) =>
          update(bookId, (prev) => {
            const next = applyStatus(prev, payload.status)
            const finishing = payload.status === 'read' || payload.status === 'dnf'
            const reviewAllowed = canReview(bookId, payload.status)
            const text = payload.reviewText.trim()
            // A reread logged straight to Read (not via Reading, which already counted it)
            const countReread = payload.status === 'read' && payload.isReread && prev.status !== 'reading'

            return {
              ...next,
              startedAt: payload.startedAt ?? next.startedAt,
              finishedAt: finishing ? (payload.finishedAt ?? todayISO()) : next.finishedAt,
              rating: payload.rating === null ? null : normalizeRating(payload.rating),
              loved: payload.loved,
              rereads: countReread ? next.rereads + 1 : next.rereads,
              // H5: otherwise keep whatever review was saved before
              reviewText: reviewAllowed ? text || null : prev.reviewText,
              containsSpoilers: reviewAllowed ? payload.containsSpoilers && text !== '' : prev.containsSpoilers,
              dnfPage: payload.status === 'dnf' ? payload.dnfPage : null,
              dnfReason: payload.status === 'dnf' ? payload.dnfReason : null,
              currentPage: payload.status === 'dnf' && payload.dnfPage !== null ? payload.dnfPage : next.currentPage,
            }
          }),

        restoreEntry: (bookId, entry) => {
          if (entry === undefined) return remove(bookId)
          set((state) => ({ entries: { ...state.entries, [bookId]: entry } }))
        },
      }
    },
    {
      name: 'goodreads-library',
      // v2 adds everRead, review and DNF fields; v3 adds dismissedRecommendations
      version: 3,
      migrate: (persisted) => {
        const state = persisted as {
          entries?: Record<string, Partial<LibraryEntry>>
          dismissedRecommendations?: string[]
        }
        const entries: Record<string, LibraryEntry> = {}
        for (const [id, entry] of Object.entries(state.entries ?? {})) {
          entries[id] = { ...EMPTY_ENTRY, ...entry, everRead: entry.everRead ?? entry.status === 'read' }
        }
        return { entries, dismissedRecommendations: state.dismissedRecommendations ?? [] }
      },
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ entries: state.entries, dismissedRecommendations: state.dismissedRecommendations }),
    },
  ),
)

/** Entry for one book; returns a stable empty entry when the book isn't shelved */
export function useLibraryEntry(bookId: string): LibraryEntry {
  return useLibrary((state) => state.entries[bookId] ?? EMPTY_ENTRY)
}
