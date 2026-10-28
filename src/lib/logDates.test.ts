import { describe, expect, it } from 'vitest'
import { checkLogDates } from './logDates'

const today = '2026-10-27'

describe('checkLogDates', () => {
  it('accepts today, past dates and empty fields', () => {
    expect(checkLogDates({ startedAt: '2026-10-01', finishedAt: today, finishing: true, today }).message).toBeNull()
    expect(checkLogDates({ startedAt: '', finishedAt: '', finishing: true, today }).message).toBeNull()
  })

  it('rejects a future start or finish, and marks only that field', () => {
    const started = checkLogDates({ startedAt: '2026-10-28', finishedAt: '', finishing: false, today })
    expect(started).toEqual({ message: "Dates can't be in the future.", startedInvalid: true, finishedInvalid: false })
    const finished = checkLogDates({ startedAt: '2026-10-01', finishedAt: '2027-01-01', finishing: true, today })
    expect(finished).toEqual({ message: "Dates can't be in the future.", startedInvalid: false, finishedInvalid: true })
  })

  it('ignores the finish date when the status has none', () => {
    expect(checkLogDates({ startedAt: '', finishedAt: '2030-01-01', finishing: false, today }).message).toBeNull()
  })

  it('still rejects a finish before the start', () => {
    const r = checkLogDates({ startedAt: '2026-10-20', finishedAt: '2026-10-10', finishing: true, today })
    expect(r).toEqual({ message: "Finish date can't be before you started.", startedInvalid: true, finishedInvalid: true })
  })
})
