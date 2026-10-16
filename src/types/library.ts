export type ReadingStatus = 'want' | 'reading' | 'read' | 'dnf'

export type DnfReason = 'not-for-me' | 'too-slow' | 'not-right-time' | 'content'

export type LibraryEntry = {
  status: ReadingStatus | null
  /** 0–5 in 0.25 steps; null = not rated */
  rating: number | null
  loved: boolean
  currentPage: number
  /** ISO dates (YYYY-MM-DD) */
  addedAt: string | null
  startedAt: string | null
  finishedAt: string | null
  rereads: number
  /** True once the book has been marked Read at least once (enables "This is a reread") */
  everRead: boolean
  reviewText: string | null
  containsSpoilers: boolean
  dnfPage: number | null
  dnfReason: DnfReason | null
}

/** One line in the reading journal */
export type ReadingEvent = {
  id: string
  bookId: string
  type: 'started' | 'finished' | 'dnf'
  /** ISO date */
  date: string
  /** Rating at the time it was finished */
  rating?: number | null
  /** Page where a DNF stopped */
  dnfPage?: number | null
  isReread: boolean
}

/** User-made shelf ("Kindle", "Borrowed"…). A book can be on many. */
export type Shelf = {
  id: string
  name: string
  bookIds: string[]
}
