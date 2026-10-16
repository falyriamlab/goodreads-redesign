import { beforeEach, describe, expect, it } from 'vitest'
import { getBookById } from '@/mocks/books'
import { currentUser } from '@/mocks/user'
import { LIBRARY_SEED, useLibrary } from '@/state/library'
import type { Book } from '@/types/book'
import { recommend } from './recommend'

const user = { genres: currentUser.favoriteGenres, moods: currentUser.favoriteMoods, pace: currentUser.preferredPace }
const forYou = () => {
  const { entries, dismissedRecommendations } = useLibrary.getState()
  return recommend({ entries, dismissed: dismissedRecommendations, user }).map((r) => r.book.id)
}

beforeEach(() => {
  localStorage.clear()
  useLibrary.setState({ entries: structuredClone(LIBRARY_SEED), dismissedRecommendations: [] })
})

describe('recommend', () => {
  it('excludes books that are Read, Reading, Want to read or DNF', () => {
    const shelved = Object.keys(LIBRARY_SEED)
    const ids = forYou()
    expect(ids.length).toBeGreaterThan(0)
    for (const id of shelved) expect(ids).not.toContain(id)

    useLibrary.getState().logBook('a-court-of-thorns-and-roses', {
      status: 'dnf',
      startedAt: null,
      finishedAt: null,
      rating: null,
      loved: false,
      reviewText: '',
      containsSpoilers: false,
      dnfPage: 50,
      dnfReason: null,
      isReread: false,
    })
    expect(forYou()).not.toContain('a-court-of-thorns-and-roses')
  })

  it('excludes dismissed books, and Undo brings them back', () => {
    const before = forYou()
    const target = before[0]
    useLibrary.getState().dismiss(target)
    expect(forYou()).not.toContain(target)

    useLibrary.getState().undoDismiss(target)
    expect(forYou()).toEqual(before)
  })

  it('gives a genre-era reason for user taste and a "loved" reason for a base book', () => {
    const { entries } = useLibrary.getState()
    const [top] = recommend({ entries, dismissed: [], user })
    expect(top.book.id).toBe('a-court-of-thorns-and-roses')
    expect(top.reason).toBe("Because you're in your Romantasy era")

    const base = getBookById('fourth-wing') as Book
    const similar = recommend({ entries, dismissed: [], base })
    expect(similar.map((r) => r.book.id)).not.toContain('fourth-wing')
    expect(similar[0].reason).toBe('Because you loved Fourth Wing')
  })
})
