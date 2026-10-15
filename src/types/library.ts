export type ReadingStatus = 'want' | 'reading' | 'read' | 'dnf'

export type LibraryEntry = {
  status: ReadingStatus | null
  /** 0–5 in 0.25 steps; null = not rated */
  rating: number | null
  loved: boolean
  currentPage: number
  /** ISO date strings */
  startedAt: string | null
  finishedAt: string | null
  rereads: number
}
