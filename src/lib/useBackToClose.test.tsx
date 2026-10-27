import { act, useEffect, useState } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it } from 'vitest'
import { useBackToClose } from './useBackToClose'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

/** Two independent overlays, like a drawer opened from another drawer */
let api: { setA: (v: boolean) => void; setB: (v: boolean) => void; a: boolean; b: boolean }
function Overlays() {
  const [a, setA] = useState(false)
  const [b, setB] = useState(false)
  useBackToClose(a, () => setA(false))
  useBackToClose(b, () => setB(false))
  useEffect(() => {
    api = { setA, setB, a, b }
  }, [a, b])
  return null
}

let root: Root | null = null
function mount() {
  const host = document.createElement('div')
  document.body.append(host)
  act(() => {
    root = createRoot(host)
    root.render(<Overlays />)
  })
}
const tick = (ms = 20) => act(() => new Promise((r) => setTimeout(r, ms)))
const back = async () => {
  history.back()
  await tick(50)
}

afterEach(() => {
  act(() => root?.unmount())
  root = null
})

describe('useBackToClose', () => {
  it('Back closes the open overlay and stays on the same URL', async () => {
    mount()
    const url = location.href
    const length = history.length
    act(() => api.setA(true))
    expect(history.length).toBe(length + 1)
    await back()
    expect(api.a).toBe(false)
    expect(location.href).toBe(url)
  })

  it('stacked overlays close one Back at a time, top first', async () => {
    mount()
    act(() => api.setA(true))
    act(() => api.setB(true))
    await back()
    expect([api.a, api.b]).toEqual([true, false])
    await back()
    expect([api.a, api.b]).toEqual([false, false])
  })

  it('closing from the UI consumes its history entry (no dead Back press afterwards)', async () => {
    mount()
    history.pushState({ page: 'before' }, '')
    const length = history.length
    act(() => api.setA(true))
    act(() => api.setA(false))
    await tick(60)
    // We're back on the entry from before the overlay opened
    expect((history.state as { page?: string }).page).toBe('before')
    expect(history.length).toBe(length + 1) // the overlay entry is still forward history, not a new step back
  })
})
