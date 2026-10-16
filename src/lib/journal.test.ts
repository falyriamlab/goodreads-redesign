import { describe, expect, it } from 'vitest'
import type { ReadingEvent } from '@/types/library'
import { groupByMonth, monthSummary } from './journal'

const ev = (id: string, type: ReadingEvent['type'], date: string): ReadingEvent => ({ id, bookId: id, type, date, isReread: false })

describe('journal', () => {
  it('groups newest month first, newest event first, with a summary', () => {
    const months = groupByMonth([
      ev('a', 'finished', '2026-09-11'),
      ev('b', 'started', '2026-10-02'),
      ev('c', 'finished', '2026-10-01'),
      ev('d', 'dnf', '2026-10-09'),
      ev('e', 'finished', '2026-10-14'),
      ev('f', 'started', '2026-08-03'),
    ])
    expect(months.map((m) => m.label)).toEqual(['October 2026', 'September 2026', 'August 2026'])
    expect(months[0].events.map((e) => e.id)).toEqual(['e', 'd', 'b', 'c'])
    expect(monthSummary(months[0])).toBe('2 finished · 1 DNF')
    expect(monthSummary(months[1])).toBe('1 finished')
    expect(monthSummary(months[2])).toBe('1 started')
  })
})
