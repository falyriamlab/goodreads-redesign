import { describe, expect, it } from 'vitest'
import { getChallengePace } from './challenge'

// 2026 is not a leap year. July 2 is day 183: expected = 60 × 183 / 365 ≈ 30.08
const july2 = new Date(2026, 6, 2)
const progress = (read: number, goal = 60) => ({ year: 2026, goal, read })

describe('challenge pace', () => {
  it('reports books ahead', () => {
    const pace = getChallengePace(progress(33), july2)
    expect(pace.diff).toBe(3)
    expect(pace.message).toBe('3 books ahead. Lowkey slaying.')
  })

  it('reports on schedule', () => {
    expect(getChallengePace(progress(30), july2).message).toBe('Right on schedule.')
  })

  it('reports books behind', () => {
    const pace = getChallengePace(progress(25), july2)
    expect(pace.diff).toBe(-5)
    expect(pace.message).toBe('5 books behind. Plenty of year left.')
  })

  it('uses the singular for one book', () => {
    expect(getChallengePace(progress(31), july2).message).toBe('1 book ahead. Lowkey slaying.')
  })

  it('says "Goal crushed" once read ≥ goal, even early in the year', () => {
    const pace = getChallengePace(progress(60), new Date(2026, 2, 1))
    expect(pace.goalMet).toBe(true)
    expect(pace.message).toBe('Goal crushed. Iconic.')
    expect(getChallengePace(progress(64), july2).message).toBe('Goal crushed. Iconic.')
  })
})
