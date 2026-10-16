import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { todayISO } from '@/lib/date'
import { normalizeRating } from '@/lib/rating'
import { getBookById } from '@/mocks/books'
import type { DnfReason, LibraryEntry, ReadingEvent, ReadingStatus, Shelf } from '@/types/library'

export const EMPTY_ENTRY: LibraryEntry = {
  status: null,
  rating: null,
  loved: false,
  currentPage: 0,
  addedAt: null,
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

/** Status change side effects shared by quick changes (chip), bulk actions, logs and imports */
function applyStatus(entry: LibraryEntry, status: ReadingStatus): LibraryEntry {
  if (entry.status === status) return entry
  const base = { ...entry, addedAt: entry.addedAt ?? todayISO() }
  if (status === 'reading') {
    // Starting again after finishing counts as a reread
    const isReread = entry.status === 'read'
    return {
      ...base,
      status,
      startedAt: todayISO(),
      currentPage: isReread ? 0 : entry.currentPage,
      rereads: isReread ? entry.rereads + 1 : entry.rereads,
    }
  }
  if (status === 'read') return { ...base, status, finishedAt: todayISO(), everRead: true }
  if (status === 'dnf') return { ...base, status, finishedAt: todayISO() }
  return { ...base, status }
}

let eventCounter = 0
const eventId = (bookId: string) => `${bookId}-${Date.now().toString(36)}-${(eventCounter++).toString(36)}`

/**
 * Journal events implied by a change from `prev` to `next`.
 * Every action goes through this, so the journal can't drift from the shelves.
 */
function eventsFor(bookId: string, prev: LibraryEntry | undefined, next: LibraryEntry): ReadingEvent[] {
  if (prev?.status === next.status) return []
  const wasRead = prev?.everRead ?? false
  switch (next.status) {
    case 'reading':
      return [{ id: eventId(bookId), bookId, type: 'started', date: next.startedAt ?? todayISO(), isReread: wasRead }]
    case 'read':
      return [
        {
          id: eventId(bookId),
          bookId,
          type: 'finished',
          date: next.finishedAt ?? todayISO(),
          rating: next.rating,
          isReread: wasRead || next.rereads > 0,
        },
      ]
    case 'dnf':
      return [
        { id: eventId(bookId), bookId, type: 'dnf', date: next.finishedAt ?? todayISO(), dnfPage: next.dnfPage, isReread: wasRead },
      ]
    default:
      return []
  }
}

/** Want to read keeps a manual priority order; new books go to the end, leavers drop out */
function reconcileWantOrder(entries: Record<string, LibraryEntry>, order: string[]): string[] {
  const want = Object.keys(entries).filter((id) => entries[id].status === 'want')
  const kept = order.filter((id) => want.includes(id))
  return [...kept, ...want.filter((id) => !kept.includes(id))]
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

export type ImportItem = {
  bookId: string
  status: ReadingStatus
  rating: number | null
  /** Date read from the export, ISO */
  finishedAt: string | null
}

export type LibraryView = 'grid' | 'list'

/** Everything an Undo needs to put back */
export type LibrarySnapshot = {
  entries: Record<string, LibraryEntry>
  history: ReadingEvent[]
  shelves: Shelf[]
  wantOrder: string[]
}

const MAX_RECENT_SEARCHES = 5

type LibraryState = LibrarySnapshot & {
  /** Book ids hidden from recommendations ("Not my vibe") */
  dismissedRecommendations: string[]
  dismiss: (bookId: string) => void
  undoDismiss: (bookId: string) => void
  /** Most recent first, max 5, no duplicates (case-insensitive) */
  recentSearches: string[]
  addRecentSearch: (query: string) => void
  removeRecentSearch: (query: string) => void
  clearRecentSearches: () => void
  /** Library grid/list preference */
  libraryView: LibraryView
  setLibraryView: (view: LibraryView) => void

  setStatus: (bookId: string, status: ReadingStatus | null) => void
  setRating: (bookId: string, rating: number | null) => void
  toggleLoved: (bookId: string) => void
  setProgress: (bookId: string, currentPage: number) => void
  /** Applies a full LogSheet save in one update */
  logBook: (bookId: string, payload: LogPayload) => void
  /** Puts back one entry (undefined = not shelved) */
  restoreEntry: (bookId: string, entry: LibraryEntry | undefined) => void

  /** Undo support: capture and restore entries, history, shelves and order together */
  takeSnapshot: () => LibrarySnapshot
  restoreSnapshot: (snapshot: LibrarySnapshot) => void

  createShelf: (name: string) => string
  renameShelf: (shelfId: string, name: string) => void
  /** Deletes the shelf only; its books stay in the library */
  deleteShelf: (shelfId: string) => void
  addToShelf: (shelfId: string, bookId: string) => void
  removeFromShelf: (shelfId: string, bookId: string) => void

  /** Move a Want-to-read book to a new position in the priority list */
  moveWant: (bookId: string, toIndex: number) => void

  bulkSetStatus: (bookIds: string[], status: ReadingStatus) => void
  bulkAddToShelf: (bookIds: string[], shelfId: string) => void
  /** Removes books from the library (and from every custom shelf) */
  bulkRemove: (bookIds: string[]) => void

  /** Applies imported rows; existing entries are only touched if listed */
  importBooks: (items: ImportItem[]) => void
}

/* ---------- Seed: Sofía's library (mock data) ---------- */

type SeedRead = [id: string, started: string, finished: string, rating: number, loved?: boolean, rereads?: number]

// Finished in 2026. The challenge counts these + her off-catalog reads, and still totals 38.
const SEED_READ: SeedRead[] = [
  ['gone-girl', '2026-01-03', '2026-01-14', 4],
  ['the-martian', '2026-02-01', '2026-02-09', 4.5, true],
  ['beach-read', '2026-03-02', '2026-03-12', 4],
  ['the-midnight-library', '2026-04-05', '2026-04-11', 3.75],
  ['circe', '2026-05-01', '2026-05-19', 4.5],
  ['project-hail-mary', '2026-06-02', '2026-06-10', 5, true],
  ['the-silent-patient', '2026-07-01', '2026-07-04', 3.5],
  ['people-we-meet-on-vacation', '2026-07-15', '2026-07-24', 4],
  ['six-of-crows', '2026-08-03', '2026-08-14', 4.25],
  ['the-song-of-achilles', '2026-08-20', '2026-08-27', 5, true, 1],
  ['book-lovers', '2026-09-05', '2026-09-11', 3.5],
  ['throne-of-glass', '2026-09-22', '2026-10-01', 3],
]

const SEED_WANT: [id: string, added: string][] = [
  ['iron-flame', '2026-05-30'],
  ['babel', '2026-02-14'],
  ['onyx-storm', '2026-06-01'],
  ['red-white-and-royal-blue', '2026-03-20'],
  ['the-seven-husbands-of-evelyn-hugo', '2026-04-02'],
  ['dune', '2026-08-30'],
  ['the-hunger-games', '2026-09-28'],
]

export const LIBRARY_SEED: Record<string, LibraryEntry> = {
  'fourth-wing': { ...EMPTY_ENTRY, status: 'reading', currentPage: 312, addedAt: '2026-07-01', startedAt: '2026-10-02' },
  'the-cruel-prince': { ...EMPTY_ENTRY, status: 'reading', currentPage: 140, addedAt: '2026-09-20', startedAt: '2026-10-09' },
  ...Object.fromEntries(
    SEED_READ.map(([id, started, finished, rating, loved = false, rereads = 0]) => [
      id,
      { ...EMPTY_ENTRY, status: 'read', rating, loved, rereads, everRead: true, addedAt: started, startedAt: started, finishedAt: finished },
    ]),
  ),
  'the-name-of-the-wind': {
    ...EMPTY_ENTRY,
    status: 'dnf',
    addedAt: '2026-09-10',
    startedAt: '2026-09-12',
    finishedAt: '2026-09-20',
    currentPage: 120,
    dnfPage: 120,
    dnfReason: 'too-slow',
  },
  ...Object.fromEntries(SEED_WANT.map(([id, added]) => [id, { ...EMPTY_ENTRY, status: 'want', addedAt: added }])),
}

/** Journal events consistent with the seed shelves */
function seedHistory(entries: Record<string, LibraryEntry>): ReadingEvent[] {
  const events: ReadingEvent[] = []
  for (const [bookId, e] of Object.entries(entries)) {
    const reread = e.rereads > 0
    if (e.startedAt) events.push({ id: `seed-${bookId}-started`, bookId, type: 'started', date: e.startedAt, isReread: reread })
    if (e.status === 'read' && e.finishedAt)
      events.push({ id: `seed-${bookId}-finished`, bookId, type: 'finished', date: e.finishedAt, rating: e.rating, isReread: reread })
    if (e.status === 'dnf' && e.finishedAt)
      events.push({ id: `seed-${bookId}-dnf`, bookId, type: 'dnf', date: e.finishedAt, dnfPage: e.dnfPage, isReread: false })
  }
  return events
}

export const HISTORY_SEED = seedHistory(LIBRARY_SEED)

export const SHELVES_SEED: Shelf[] = [
  { id: 'romantasy', name: 'Romantasy', bookIds: ['fourth-wing', 'iron-flame', 'onyx-storm', 'throne-of-glass'] },
  { id: 'kindle', name: 'Kindle', bookIds: ['fourth-wing', 'beach-read', 'the-midnight-library', 'the-martian'] },
  { id: 'borrowed', name: 'Borrowed', bookIds: ['the-cruel-prince', 'circe'] },
]

export const WANT_ORDER_SEED = SEED_WANT.map(([id]) => id)

const newShelfId = (name: string) =>
  `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'shelf'}-${Date.now().toString(36)}`

export const useLibrary = create<LibraryState>()(
  persist(
    (set, get) => {
      /**
       * Applies entry changes for several books at once, appends the implied journal events
       * and keeps wantOrder / custom shelves consistent. `null` removes a book from the library.
       */
      const change = (fn: (entries: Record<string, LibraryEntry>) => Record<string, LibraryEntry | null>) =>
        set((state) => {
          const updates = fn(state.entries)
          const entries = { ...state.entries }
          const events: ReadingEvent[] = []
          const removed: string[] = []
          for (const [bookId, next] of Object.entries(updates)) {
            if (next === null) {
              delete entries[bookId]
              removed.push(bookId)
              continue
            }
            events.push(...eventsFor(bookId, state.entries[bookId], next))
            entries[bookId] = next
          }
          return {
            entries,
            history: events.length ? [...state.history, ...events] : state.history,
            wantOrder: reconcileWantOrder(entries, state.wantOrder),
            shelves: removed.length
              ? state.shelves.map((s) => ({ ...s, bookIds: s.bookIds.filter((id) => !removed.includes(id)) }))
              : state.shelves,
          }
        })

      const update = (bookId: string, fn: (entry: LibraryEntry) => LibraryEntry) =>
        change((entries) => ({ [bookId]: fn(entries[bookId] ?? EMPTY_ENTRY) }))

      /** Re-logging a finished book (e.g. a new rating) updates its latest "finished" event */
      const syncLatestFinished = (bookId: string, patch: Partial<ReadingEvent>) =>
        set((state) => {
          const index = state.history.findLastIndex((e) => e.bookId === bookId && e.type === 'finished')
          if (index < 0) return state
          const history = [...state.history]
          history[index] = { ...history[index], ...patch }
          return { history }
        })

      const editShelves = (fn: (shelves: Shelf[]) => Shelf[]) => set((state) => ({ shelves: fn(state.shelves) }))

      return {
        entries: LIBRARY_SEED,
        history: HISTORY_SEED,
        shelves: SHELVES_SEED,
        wantOrder: WANT_ORDER_SEED,
        dismissedRecommendations: [],
        recentSearches: [],
        libraryView: 'grid',

        dismiss: (bookId) =>
          set((state) =>
            state.dismissedRecommendations.includes(bookId)
              ? state
              : { dismissedRecommendations: [...state.dismissedRecommendations, bookId] },
          ),

        undoDismiss: (bookId) =>
          set((state) => ({ dismissedRecommendations: state.dismissedRecommendations.filter((id) => id !== bookId) })),

        addRecentSearch: (query) => {
          const q = query.trim()
          if (!q) return
          set((state) => ({
            recentSearches: [q, ...state.recentSearches.filter((r) => r.toLowerCase() !== q.toLowerCase())].slice(
              0,
              MAX_RECENT_SEARCHES,
            ),
          }))
        },

        removeRecentSearch: (query) =>
          set((state) => ({ recentSearches: state.recentSearches.filter((r) => r !== query) })),

        clearRecentSearches: () => set({ recentSearches: [] }),

        setLibraryView: (view) => set({ libraryView: view }),

        setStatus: (bookId, status) => {
          // "Remove from shelves": drop the whole entry (callers snapshot it for Undo)
          if (status === null) return change(() => ({ [bookId]: null }))
          update(bookId, (entry) => applyStatus(entry, status))
        },

        setRating: (bookId, rating) => {
          const value = rating === null ? null : normalizeRating(rating)
          update(bookId, (entry) => ({ ...entry, rating: value }))
          if (get().entries[bookId]?.status === 'read') syncLatestFinished(bookId, { rating: value })
        },

        toggleLoved: (bookId) => update(bookId, (entry) => ({ ...entry, loved: !entry.loved })),

        setProgress: (bookId, currentPage) =>
          update(bookId, (entry) => {
            const page = Math.max(0, Math.floor(currentPage))
            // Logging progress on an unshelved / want-to-read book means you've started it
            const starting = entry.status === null || entry.status === 'want'
            return {
              ...entry,
              addedAt: entry.addedAt ?? todayISO(),
              currentPage: page,
              status: starting ? 'reading' : entry.status,
              startedAt: starting ? todayISO() : entry.startedAt,
            }
          }),

        logBook: (bookId, payload) => {
          const before = get().entries[bookId]
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
          })
          // Same status (already Read): keep the journal's finished line in sync with the edit
          const after = get().entries[bookId]
          if (before?.status === 'read' && after.status === 'read') {
            syncLatestFinished(bookId, { rating: after.rating, date: after.finishedAt ?? todayISO() })
          }
        },

        restoreEntry: (bookId, entry) => {
          if (entry === undefined) return change(() => ({ [bookId]: null }))
          set((state) => {
            const entries = { ...state.entries, [bookId]: entry }
            return { entries, wantOrder: reconcileWantOrder(entries, state.wantOrder) }
          })
        },

        takeSnapshot: () => {
          const { entries, history, shelves, wantOrder } = get()
          return { entries, history, shelves, wantOrder }
        },

        restoreSnapshot: (snapshot) => set({ ...snapshot }),

        createShelf: (name) => {
          const id = newShelfId(name)
          editShelves((shelves) => [...shelves, { id, name: name.trim(), bookIds: [] }])
          return id
        },

        renameShelf: (shelfId, name) =>
          editShelves((shelves) => shelves.map((s) => (s.id === shelfId ? { ...s, name: name.trim() } : s))),

        deleteShelf: (shelfId) => editShelves((shelves) => shelves.filter((s) => s.id !== shelfId)),

        addToShelf: (shelfId, bookId) =>
          editShelves((shelves) =>
            shelves.map((s) => (s.id === shelfId && !s.bookIds.includes(bookId) ? { ...s, bookIds: [...s.bookIds, bookId] } : s)),
          ),

        removeFromShelf: (shelfId, bookId) =>
          editShelves((shelves) => shelves.map((s) => (s.id === shelfId ? { ...s, bookIds: s.bookIds.filter((id) => id !== bookId) } : s))),

        moveWant: (bookId, toIndex) =>
          set((state) => {
            const order = state.wantOrder.filter((id) => id !== bookId)
            if (order.length === state.wantOrder.length) return state
            const index = Math.max(0, Math.min(order.length, toIndex))
            order.splice(index, 0, bookId)
            return { wantOrder: order }
          }),

        bulkSetStatus: (bookIds, status) =>
          change((entries) => Object.fromEntries(bookIds.map((id) => [id, applyStatus(entries[id] ?? EMPTY_ENTRY, status)]))),

        bulkAddToShelf: (bookIds, shelfId) =>
          editShelves((shelves) =>
            shelves.map((s) => (s.id === shelfId ? { ...s, bookIds: [...new Set([...s.bookIds, ...bookIds])] } : s)),
          ),

        bulkRemove: (bookIds) => change(() => Object.fromEntries(bookIds.map((id) => [id, null]))),

        importBooks: (items) => {
          const before = get().entries
          change((entries) =>
            Object.fromEntries(
              items.map(({ bookId, status, rating, finishedAt }) => {
                const prev = entries[bookId] ?? EMPTY_ENTRY
                const next = applyStatus(prev, status)
                return [
                  bookId,
                  {
                    ...next,
                    rating: rating === null ? next.rating : normalizeRating(rating),
                    finishedAt: status === 'read' && finishedAt ? finishedAt : next.finishedAt,
                  },
                ]
              }),
            ),
          )
          // Already Read before the import: no new event, so update the journal's finished line
          for (const { bookId, status } of items) {
            const after = get().entries[bookId]
            if (before[bookId]?.status === 'read' && status === 'read') {
              syncLatestFinished(bookId, { rating: after.rating, date: after.finishedAt ?? todayISO() })
            }
          }
        },
      }
    },
    {
      name: 'goodreads-library',
      // v2 everRead/review/DNF; v3 dismissedRecommendations; v4 recentSearches;
      // v5 history, shelves, wantOrder, addedAt, libraryView
      version: 5,
      migrate: (persisted, version) => {
        const state = persisted as Partial<LibrarySnapshot> & {
          entries?: Record<string, Partial<LibraryEntry>>
          dismissedRecommendations?: string[]
          recentSearches?: string[]
          libraryView?: LibraryView
        }
        const entries: Record<string, LibraryEntry> = {}
        for (const [id, entry] of Object.entries(state.entries ?? {})) {
          entries[id] = {
            ...EMPTY_ENTRY,
            ...entry,
            everRead: entry.everRead ?? entry.status === 'read',
            addedAt: entry.addedAt ?? entry.startedAt ?? null,
          }
        }
        return {
          entries,
          // Before v5 there was no journal: rebuild it from the shelves
          history: version < 5 ? seedHistory(entries) : (state.history ?? []),
          shelves: state.shelves ?? SHELVES_SEED.map((s) => ({ ...s, bookIds: s.bookIds.filter((id) => id in entries) })),
          wantOrder: reconcileWantOrder(entries, state.wantOrder ?? []),
          dismissedRecommendations: state.dismissedRecommendations ?? [],
          recentSearches: state.recentSearches ?? [],
          libraryView: state.libraryView ?? 'grid',
        }
      },
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        entries: state.entries,
        history: state.history,
        shelves: state.shelves,
        wantOrder: state.wantOrder,
        dismissedRecommendations: state.dismissedRecommendations,
        recentSearches: state.recentSearches,
        libraryView: state.libraryView,
      }),
    },
  ),
)

/** Entry for one book; returns a stable empty entry when the book isn't shelved */
export function useLibraryEntry(bookId: string): LibraryEntry {
  return useLibrary((state) => state.entries[bookId] ?? EMPTY_ENTRY)
}
