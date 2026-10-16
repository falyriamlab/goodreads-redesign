export type ReadingStatus = 'want' | 'reading' | 'read' | 'dnf'

export type DnfReason = 'not-for-me' | 'too-slow' | 'not-right-time' | 'content'

export type LibraryEntry = {
  status: ReadingStatus | null
  /** 0–5 in 0.25 steps; null = not rated */
  rating: number | null
  loved: boolean
  currentPage: number
  /** ISO dates (YYYY-MM-DD) */
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
