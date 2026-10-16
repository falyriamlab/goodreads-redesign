import { currentUser } from '@/mocks/user'
import { LIBRARY_SEED } from '@/state/library'
import type { LibraryEntry } from '@/types/library'

/** Books marked Read with a finish date in `year`. DNFs never count. */
export function countReadInYear(entries: Record<string, LibraryEntry>, year: number): number {
  return Object.values(entries).filter((e) => e.status === 'read' && e.finishedAt?.startsWith(String(year))).length
}

const { year, goal, read } = currentUser.challenge

/**
 * Sofía's 38 reads include books outside our 12-book mock catalog.
 * Those stay fixed; catalog books are counted live from the store.
 */
const OFF_CATALOG_READS = read - countReadInYear(LIBRARY_SEED, year)

export type ChallengeProgress = { year: number; goal: number; read: number }

/** Same selector the LogSheet uses for "That's {n} of {goal}" */
export function getChallengeProgress(entries: Record<string, LibraryEntry>): ChallengeProgress {
  return { year, goal, read: OFF_CATALOG_READS + countReadInYear(entries, year) }
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
export function getChallengePace(progress: ChallengeProgress, now = new Date()): ChallengePace {
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
