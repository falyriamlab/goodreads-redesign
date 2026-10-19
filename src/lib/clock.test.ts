import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { activities, FOLLOWING_SEED } from '@/mocks/community'
import { HISTORY_SEED, IMPORTED_COUNT_ONLY_SEED } from '@/state/library'
import { getChallengePace, getChallengeProgress } from './challenge'
import { DEMO_NOW, isDemoClock, now, setDemoClock } from './clock'
import { filterFeed } from './community'
import { formatTimeAgo, todayISO } from './date'
import { currentMonthRecap } from './stats'

/** What the feed shows for each event: the same strings the UI renders */
const feedTimes = () => filterFeed(activities, 'all', FOLLOWING_SEED).map((a) => formatTimeAgo(a.createdAt))

describe('demo clock', () => {
  beforeEach(() => {
    localStorage.clear()
    setDemoClock(true)
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
    setDemoClock(true)
  })

  it('is on by default and frozen at Oct 16, 2026, 10:00 local time', () => {
    expect(isDemoClock()).toBe(true)
    expect(now().getTime()).toBe(new Date(2026, 9, 16, 10, 0).getTime())
    expect(todayISO()).toBe('2026-10-16')
  })

  it('makes the feed read the same on any real day', () => {
    vi.setSystemTime(new Date(2026, 9, 19, 18, 30))
    const monday = feedTimes()
    vi.setSystemTime(new Date(2027, 4, 2, 7, 0))
    expect(feedTimes()).toEqual(monday)
    // Maya's buddy read post at 07:45 → 2h before 10:00
    expect(monday[0]).toBe('2h ago')
  })

  it('always offers "Share your October recap" (3 books finished in October)', () => {
    vi.setSystemTime(new Date(2027, 0, 5))
    expect(currentMonthRecap(HISTORY_SEED)).toEqual({ monthName: 'October', href: '/share?type=month&month=2026-10' })
  })

  it('keeps the challenge pace stable', () => {
    const progress = getChallengeProgress(HISTORY_SEED, IMPORTED_COUNT_ONLY_SEED)
    vi.setSystemTime(new Date(2028, 1, 1))
    // Oct 16 is day 289: 46 × 289 / 365 ≈ 36.4 → 38 read is 2 ahead
    expect(getChallengePace(progress).diff).toBe(2)
  })

  it('switched off, uses the real time (and remembers it)', () => {
    vi.setSystemTime(new Date(2027, 2, 3, 9, 0))
    setDemoClock(false)
    expect(now().getFullYear()).toBe(2027)
    expect(localStorage.getItem('demo-clock')).toBe('off')
    expect(currentMonthRecap(HISTORY_SEED)).toBeNull()
    setDemoClock(true)
    expect(now().getTime()).toBe(DEMO_NOW.getTime())
  })
})
