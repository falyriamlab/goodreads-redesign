import { beforeEach, describe, expect, it } from 'vitest'
import { getChallengeProgress } from '@/lib/challenge'
import { sortBooks } from '@/lib/libraryView'
import { books } from '@/mocks/books'
import { HISTORY_SEED, IMPORTED_COUNT_ONLY_SEED, LIBRARY_SEED, SHELVES_SEED, useLibrary, WANT_ORDER_SEED, type LogPayload } from './library'

const store = () => useLibrary.getState()
const eventsOf = (id: string) => store().history.filter((e) => e.bookId === id)

const log = (status: LogPayload['status'], extra: Partial<LogPayload> = {}): LogPayload => ({
  status,
  startedAt: null,
  finishedAt: null,
  rating: null,
  loved: false,
  reviewText: '',
  containsSpoilers: false,
  dnfPage: null,
  dnfReason: null,
  isReread: false,
  ...extra,
})

beforeEach(() => {
  localStorage.clear()
  useLibrary.setState({
    entries: structuredClone(LIBRARY_SEED),
    history: structuredClone(HISTORY_SEED),
    shelves: structuredClone(SHELVES_SEED),
    wantOrder: [...WANT_ORDER_SEED],
  })
})

describe('seed', () => {
  it('has a journal consistent with the shelves and the challenge', () => {
    const finished = HISTORY_SEED.filter((e) => e.type === 'finished')
    const read = Object.entries(LIBRARY_SEED).filter(([, e]) => e.status === 'read')
    expect(finished).toHaveLength(read.length)
    for (const [id, e] of read) expect(finished.find((f) => f.bookId === id)?.date).toBe(e.finishedAt)
    expect(HISTORY_SEED.filter((e) => e.type === 'dnf').map((e) => e.bookId)).toEqual(['the-name-of-the-wind'])
    expect(getChallengeProgress(HISTORY_SEED, IMPORTED_COUNT_ONLY_SEED).read).toBe(38)
    expect(Object.values(LIBRARY_SEED).filter((e) => e.status === 'want')).toHaveLength(7)
    expect(Object.values(LIBRARY_SEED).filter((e) => e.status === 'reading')).toHaveLength(2)
  })
})

describe('history', () => {
  it('setStatus records started / finished / dnf events', () => {
    store().setStatus('babel', 'reading')
    store().setStatus('babel', 'read')
    expect(eventsOf('babel').map((e) => e.type)).toEqual(['started', 'finished'])
    store().setStatus('dune', 'dnf')
    expect(eventsOf('dune').map((e) => e.type)).toEqual(['dnf'])
  })

  it('the LogSheet save records a finished event with its date and rating', () => {
    store().logBook('fourth-wing', log('read', { finishedAt: '2026-10-15', rating: 4.25 }))
    const finished = eventsOf('fourth-wing').filter((e) => e.type === 'finished')
    expect(finished).toEqual([expect.objectContaining({ date: '2026-10-15', rating: 4.25, isReread: false })])
  })

  it('marks rereads', () => {
    // Read → Reading again → Read
    store().setStatus('six-of-crows', 'reading')
    store().logBook('six-of-crows', log('read', { finishedAt: '2026-10-16', rating: 4.5 }))
    const events = eventsOf('six-of-crows')
    expect(events.at(-2)).toMatchObject({ type: 'started', isReread: true })
    expect(events.at(-1)).toMatchObject({ type: 'finished', isReread: true, rating: 4.5 })
    expect(store().entries['six-of-crows'].rereads).toBe(1)
  })

  it('re-rating a finished book updates its journal line instead of adding one', () => {
    const before = store().history.length
    store().setRating('beach-read', 5)
    expect(store().history).toHaveLength(before)
    expect(eventsOf('beach-read').find((e) => e.type === 'finished')?.rating).toBe(5)
  })
})

describe('import', () => {
  it('adds events for new books and re-dates the journal line of books already read', () => {
    const before = store().history.length
    store().importBooks([
      { bookId: 'normal-people', status: 'read', rating: 3, finishedAt: '2025-10-02' },
      { bookId: 'gone-girl', status: 'read', rating: 5, finishedAt: '2025-11-20' },
    ])
    expect(store().history).toHaveLength(before + 1)
    expect(eventsOf('normal-people')).toEqual([expect.objectContaining({ type: 'finished', date: '2025-10-02', rating: 3 })])
    expect(eventsOf('gone-girl').find((e) => e.type === 'finished')).toMatchObject({ date: '2025-11-20', rating: 5 })
  })
})

describe('shelves', () => {
  it('create, rename, add, remove and delete', () => {
    const id = store().createShelf('Audiobooks')
    store().renameShelf(id, 'Listening')
    store().addToShelf(id, 'the-martian')
    store().addToShelf(id, 'the-martian') // no duplicates
    store().addToShelf(id, 'dune')
    store().removeFromShelf(id, 'dune')
    expect(store().shelves.find((s) => s.id === id)).toEqual({ id, name: 'Listening', bookIds: ['the-martian'] })
  })

  it('deleting a shelf keeps its books in the library', () => {
    const kindle = store().shelves.find((s) => s.id === 'kindle')!
    store().deleteShelf('kindle')
    expect(store().shelves.map((s) => s.id)).not.toContain('kindle')
    for (const id of kindle.bookIds) expect(store().entries[id]).toBeDefined()
  })

  it('a book can be on several shelves', () => {
    const on = store().shelves.filter((s) => s.bookIds.includes('fourth-wing')).map((s) => s.id)
    expect(on).toEqual(['romantasy', 'kindle'])
  })
})

describe('bulk actions + Undo', () => {
  const three = ['iron-flame', 'babel', 'dune']

  it('bulkSetStatus moves several books and Undo restores everything', () => {
    const snapshot = store().takeSnapshot()
    store().bulkSetStatus(three, 'read')
    for (const id of three) expect(store().entries[id].status).toBe('read')
    expect(store().wantOrder).not.toContain('babel')
    expect(store().history.filter((e) => three.includes(e.bookId) && e.type === 'finished')).toHaveLength(3)

    store().restoreSnapshot(snapshot)
    expect(store().entries).toEqual(LIBRARY_SEED)
    expect(store().history).toEqual(HISTORY_SEED)
    expect(store().wantOrder).toEqual(WANT_ORDER_SEED)
  })

  it('bulkAddToShelf and bulkRemove, with Undo', () => {
    const snapshot = store().takeSnapshot()
    store().bulkAddToShelf(three, 'borrowed')
    expect(store().shelves.find((s) => s.id === 'borrowed')!.bookIds).toEqual(['the-cruel-prince', 'circe', ...three])

    store().bulkRemove(['fourth-wing', 'circe'])
    expect(store().entries['fourth-wing']).toBeUndefined()
    // Removed books also leave custom shelves
    expect(store().shelves.some((s) => s.bookIds.includes('fourth-wing') || s.bookIds.includes('circe'))).toBe(false)

    store().restoreSnapshot(snapshot)
    expect(store().shelves).toEqual(SHELVES_SEED)
    expect(store().entries['fourth-wing']).toEqual(LIBRARY_SEED['fourth-wing'])
  })
})

describe('wantOrder', () => {
  it('appends new Want books, drops leavers, and moveWant reorders', () => {
    store().setStatus('verity', 'want')
    expect(store().wantOrder.at(-1)).toBe('verity')
    store().setStatus('iron-flame', 'reading')
    expect(store().wantOrder).not.toContain('iron-flame')

    store().moveWant('verity', 0)
    expect(store().wantOrder[0]).toBe('verity')
    store().moveWant('verity', 2)
    expect(store().wantOrder[2]).toBe('verity')
  })

  it('"My order" sorting follows wantOrder', () => {
    store().moveWant('the-hunger-games', 0)
    const want = books.filter((b) => store().entries[b.id]?.status === 'want')
    const sorted = sortBooks(want, store().entries, 'my-order', store().wantOrder).map((b) => b.id)
    expect(sorted).toEqual(store().wantOrder)
    expect(sorted[0]).toBe('the-hunger-games')
  })
})
