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

export function getChallengeProgress(entries: Record<string, LibraryEntry>) {
  return { year, goal, read: OFF_CATALOG_READS + countReadInYear(entries, year) }
}
