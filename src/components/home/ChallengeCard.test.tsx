import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'
import { getChallengePace, type ChallengeProgress } from '@/lib/challenge'
import { ChallengeCard } from './ChallengeCard'

// React's act() needs this flag outside a test framework integration
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const oct16 = new Date(2026, 9, 16, 10)
const progress = (read: number): ChallengeProgress => ({ year: 2026, goal: 46, read, detailed: read, countOnly: 0 })

let root: Root | null = null
function render(read: number) {
  const host = document.createElement('div')
  document.body.append(host)
  const challenge = progress(read)
  act(() => {
    root = createRoot(host)
    root.render(
      <MemoryRouter>
        <ChallengeCard challenge={challenge} pace={getChallengePace(challenge, oct16)} percent={Math.min(100, Math.round((read / 46) * 100))} />
      </MemoryRouter>,
    )
  })
  return host
}

afterEach(() => {
  act(() => root?.unmount())
  root = null
  document.body.innerHTML = ''
})

describe('ChallengeCard', () => {
  it('is a card with the count, an ink progress bar and the pace message', () => {
    const host = render(38)
    const section = host.querySelector('section')!
    expect(section.className).toContain('bg-card')
    expect(section.className).not.toContain('bg-primary')
    expect(host.querySelector('h2')!.textContent).toBe('2026 reading challenge')
    expect(host.querySelector('.stat-number')!.textContent).toBe('38')

    const bar = host.querySelector('[role="progressbar"]')!
    expect(bar.getAttribute('aria-valuetext')).toBe('38 of 46 books')
    expect(bar.getAttribute('aria-labelledby')).toBe(host.querySelector('h2')!.id)
    expect(bar.firstElementChild!.className).toContain('bg-foreground')

    expect(host.textContent).toContain('ahead. Lowkey slaying.')
    const link = host.querySelector('a')!
    expect(link.getAttribute('href')).toBe('/profile/stats')
    expect(link.textContent).toBe('See stats')
  })

  it('once the goal is met: "Goal crushed. Iconic." and "Raise your goal"', () => {
    const host = render(46)
    expect(host.textContent).toContain('Goal crushed. Iconic.')
    expect(host.querySelector('a')!.textContent).toBe('Raise your goal')
  })
})
