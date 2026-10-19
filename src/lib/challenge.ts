import { currentUser } from '@/mocks/user'
import type { LibraryEntry, ReadingEvent } from '@/types/library'

/** Books marked Read with a finish date in `year`. DNFs never count. */
export function countReadInYear(entries: Record<string, LibraryEntry>, year: number): number {
  return Object.values(entries).filter((e) => e.status === 'read' && e.finishedAt?.startsWith(String(year))).length
}

/** Finishes logged in the journal for `year` (a reread finished on another day counts again; DNFs never count) */
export function countFinishedInYear(history: ReadingEvent[], year: number): number {
  const keys = new Set(
    history.filter((e) => e.type === 'finished' && e.date.startsWith(`${year}-`)).map((e) => `${e.bookId}-${e.date}`),
  )
  return keys.size
}

const { year, goal } = currentUser.challenge

export type ChallengeProgress = {
  year: number
  goal: number
  read: number
  /** Finishes with full details (journal) */
  detailed: number
  /** Imported from another app as a number only (no books attached) */
  countOnly: number
}

/**
 * Challenge = journal finishes this year + reads imported as a count only.
 * Same selector everywhere (Home, LogSheet, Profile, Stats, Share).
 */
export function getChallengeProgress(history: ReadingEvent[], importedCountOnly: number): ChallengeProgress {
  const detailed = countFinishedInYear(history, year)
  return { year, goal, read: detailed + importedCountOnly, detailed, countOnly: importedCountOnly }
}

/** "Based on 12 books with full details · 26 imported as count only." */
export function detailNote(detailed: number, countOnly: number): string {
  const books = (n: number) => `${n} ${n === 1 ? 'book' : 'books'}`
  return countOnly > 0
    ? `Based on ${books(detailed)} with full details · ${countOnly} imported as count only.`
    : `Based on ${books(detailed)} with full details.`
}

export type ChallengePace = {
  /** Books you'd have read by now at an even pace */
  expected: number
  /** read − expected, rounded */
  diff: number
  goalMet: boolean
  message: string
}

const isLeap = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0

/** Day of the year, 1 = Jan 1 (local time) */
function dayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 1)
  return Math.floor((date.getTime() - start.getTime()) / 86_400_000) + 1
}

/** `now` is injectable so tests can pin the date */
export function getChallengePace(progress: Pick<ChallengeProgress, 'year' | 'goal' | 'read'>, now = new Date()): ChallengePace {
  const days = isLeap(progress.year) ? 366 : 365
  // Before/after the challenge year, clamp to its first/last day
  const day =
    now.getFullYear() < progress.year ? 0 : now.getFullYear() > progress.year ? days : dayOfYear(now)
  const expected = (progress.goal * day) / days
  const diff = Math.round(progress.read - expected)
  const goalMet = progress.read >= progress.goal

  const books = (n: number) => `${n} ${n === 1 ? 'book' : 'books'}`
  const message = goalMet
    ? 'Goal crushed. Iconic.'
    : diff >= 1
      ? `${books(diff)} ahead. Lowkey slaying.`
      : diff === 0
        ? 'Right on schedule.'
        : `${books(-diff)} behind. Plenty of year left.`

  return { expected, diff, goalMet, message }
}
