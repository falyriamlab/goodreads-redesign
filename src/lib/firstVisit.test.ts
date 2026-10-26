import { beforeEach, describe, expect, it } from 'vitest'
import { HISTORY_SEED, LIBRARY_SEED, useLibrary } from '@/state/library'
import { DEMO_NOW, isDemoClock, now, setDemoClock } from './clock'
import { LIBRARY_STORAGE_KEY, seedFirstVisit } from './firstVisit'

describe('first visit', () => {
  beforeEach(() => localStorage.clear())

  it('with empty storage, saves the demo seed and turns the demo clock on', () => {
    setDemoClock(false)
    localStorage.clear()
    expect(seedFirstVisit()).toBe(true)

    const saved = JSON.parse(localStorage.getItem(LIBRARY_STORAGE_KEY)!)
    expect(saved.state.entries).toEqual(LIBRARY_SEED)
    expect(saved.state.history).toEqual(HISTORY_SEED)
    expect(isDemoClock()).toBe(true)
    expect(now().getTime()).toBe(DEMO_NOW.getTime())
  })

  it('leaves a returning visitor alone', () => {
    localStorage.setItem('theme', 'dark')
    useLibrary.getState().setStatus('dune', 'reading')
    const before = localStorage.getItem(LIBRARY_STORAGE_KEY)
    expect(seedFirstVisit()).toBe(false)
    expect(localStorage.getItem(LIBRARY_STORAGE_KEY)).toBe(before)
  })
})
