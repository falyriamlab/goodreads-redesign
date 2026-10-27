import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { isChunkLoadError, reloadOnceForChunkError } from './chunkReload'

const chunkError = new TypeError('Failed to fetch dynamically imported module: https://app/assets/ProfilePage-Df0W.js')

describe('chunk reload after a deploy', () => {
  beforeEach(() => sessionStorage.clear())
  afterEach(() => vi.restoreAllMocks())

  it('recognizes missing-chunk errors from Chrome, Safari and Firefox, and nothing else', () => {
    expect(isChunkLoadError(chunkError)).toBe(true)
    expect(isChunkLoadError(new TypeError('Importing a module script failed.'))).toBe(true)
    expect(isChunkLoadError(new Error('error loading dynamically imported module'))).toBe(true)
    expect(isChunkLoadError(new Error("Cannot read properties of undefined (reading 'title')"))).toBe(false)
  })

  it('reloads once when online, then shows the recovery screen instead of looping', () => {
    const reload = vi.fn()
    expect(reloadOnceForChunkError(chunkError, 1_000, reload)).toBe(true)
    expect(reload).toHaveBeenCalledTimes(1)
    // Same error right after the reload: no second reload
    expect(reloadOnceForChunkError(chunkError, 4_000, reload)).toBe(false)
    expect(reload).toHaveBeenCalledTimes(1)
    // Much later (another deploy): it may reload again
    expect(reloadOnceForChunkError(chunkError, 60_000, reload)).toBe(true)
  })

  it('never reloads offline or for other errors', () => {
    const reload = vi.fn()
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    expect(reloadOnceForChunkError(chunkError, 1_000, reload)).toBe(false)
    vi.restoreAllMocks()
    expect(reloadOnceForChunkError(new Error('boom'), 1_000, reload)).toBe(false)
    expect(reload).not.toHaveBeenCalled()
  })
})
