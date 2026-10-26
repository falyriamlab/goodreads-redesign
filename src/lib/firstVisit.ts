import { useLibrary } from '@/state/library'
import { setDemoClock } from './clock'

export const LIBRARY_STORAGE_KEY = 'goodreads-library'

/**
 * Someone opening the shared link for the first time (empty localStorage) gets the full demo:
 * Sofía's seeded library, community and profile, saved right away, with the demo clock on
 * (Oct 16, 2026), so the app looks lived-in from the first second. Returns true when it seeded.
 */
export function seedFirstVisit(): boolean {
  try {
    if (localStorage.length > 0) return false
    setDemoClock(true)
    // Writing the initial state makes persist save the seed now, not on the first interaction
    useLibrary.setState(useLibrary.getInitialState())
    return true
  } catch {
    // Storage blocked (private mode): the in-memory seed still renders
    return false
  }
}
