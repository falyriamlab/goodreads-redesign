import { useSyncExternalStore } from 'react'

/**
 * DEV TOGGLE for the visual-pass exploration (Home + book page only).
 * ?direction=a | b picks a direction and remembers it while you navigate;
 * ?direction=current goes back to the shipped design. Also switchable from /dev/components.
 */
export type Direction = 'current' | 'a' | 'b'

export const DIRECTIONS: { value: Direction; name: string; summary: string }[] = [
  { value: 'current', name: 'Current', summary: 'What ships on main today' },
  { value: 'a', name: 'A · Marginalia', summary: 'Editorial and light: paper bands, big serif numbers, covers as objects' },
  { value: 'b', name: 'B · Night Shelf', summary: 'Immersive and dark-first: covers bleed into the page, floating pill nav' },
]

const KEY = 'direction'
const listeners = new Set<() => void>()
const isDirection = (v: string | null): v is Direction => v === 'current' || v === 'a' || v === 'b'

function readStored(): Direction {
  try {
    const v = localStorage.getItem(KEY)
    return isDirection(v) ? v : 'current'
  } catch {
    return 'current'
  }
}

let direction: Direction = readStored()

export function getDirection(): Direction {
  return direction
}

export function setDirection(next: Direction) {
  if (next === direction) return
  direction = next
  try {
    if (next === 'current') localStorage.removeItem(KEY)
    else localStorage.setItem(KEY, next)
  } catch {
    // Storage blocked: lasts for this session
  }
  listeners.forEach((l) => l())
}

/** Reads ?direction= from a query string (called on every navigation) */
export function syncDirectionFromSearch(search: string) {
  const v = new URLSearchParams(search).get('direction')
  if (isDirection(v)) setDirection(v)
}

function subscribe(l: () => void) {
  listeners.add(l)
  return () => listeners.delete(l)
}

export function useDirection(): Direction {
  return useSyncExternalStore(subscribe, getDirection, getDirection)
}
