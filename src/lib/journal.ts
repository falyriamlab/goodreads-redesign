import type { ReadingEvent } from '@/types/library'

export type JournalMonth = {
  /** "2026-10" */
  key: string
  /** "October 2026" */
  label: string
  /** Newest first */
  events: ReadingEvent[]
  finished: number
  started: number
  dnf: number
}

export function monthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

/** Reverse-chronological events grouped by month (newest month first) */
export function groupByMonth(events: ReadingEvent[]): JournalMonth[] {
  const sorted = [...events].sort((a, b) => b.date.localeCompare(a.date) || typeOrder[a.type] - typeOrder[b.type])
  const months = new Map<string, JournalMonth>()
  for (const event of sorted) {
    const key = event.date.slice(0, 7)
    let month = months.get(key)
    if (!month) {
      month = { key, label: monthLabel(key), events: [], finished: 0, started: 0, dnf: 0 }
      months.set(key, month)
    }
    month.events.push(event)
    month[event.type === 'finished' ? 'finished' : event.type === 'dnf' ? 'dnf' : 'started']++
  }
  return [...months.values()]
}

// Same day: show the ending before the start (it happened later in the story)
const typeOrder: Record<ReadingEvent['type'], number> = { finished: 0, dnf: 0, started: 1 }

/** "4 finished · 1 DNF" (falls back to "2 started") */
export function monthSummary(m: JournalMonth): string {
  const parts = [m.finished ? `${m.finished} finished` : '', m.dnf ? `${m.dnf} DNF` : ''].filter(Boolean)
  if (parts.length) return parts.join(' · ')
  return `${m.started} started`
}
