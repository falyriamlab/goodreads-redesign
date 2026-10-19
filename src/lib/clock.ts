import { useSyncExternalStore } from 'react'

/**
 * The app's single source of "now". Every date in the UI (relative times, challenge pace,
 * the month recap, LogSheet defaults, message timestamps) goes through now(), never new Date().
 *
 * Demo clock (default on): frozen at Oct 16, 2026, 10:00 local time, so the mock data
 * ("2h ago", "Share your October recap", "3 books ahead") reads the same on any day.
 * Settings → Data can switch it off to use the real time.
 * (Unique ids still use Date.now(): a frozen clock would make them collide.)
 */
export const DEMO_NOW = new Date(2026, 9, 16, 10, 0, 0)

const STORAGE_KEY = 'demo-clock'
const listeners = new Set<() => void>()

function readStored(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== 'off'
  } catch {
    return true
  }
}

let demo = readStored()

export function now(): Date {
  return demo ? new Date(DEMO_NOW) : new Date()
}

export function isDemoClock(): boolean {
  return demo
}

export function setDemoClock(on: boolean) {
  demo = on
  try {
    if (on) localStorage.removeItem(STORAGE_KEY)
    else localStorage.setItem(STORAGE_KEY, 'off')
  } catch {
    // Storage blocked: the choice lasts for this session
  }
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** For the Settings switch */
export function useDemoClock(): boolean {
  return useSyncExternalStore(subscribe, isDemoClock, isDemoClock)
}
