import { beforeEach, describe, expect, it } from 'vitest'
import { getChallengeProgress } from '@/lib/challenge'
import { todayISO } from '@/lib/date'
import { HISTORY_SEED, LIBRARY_SEED, SHELVES_SEED, useLibrary, WANT_ORDER_SEED, type LogPayload } from './library'

const basePayload: LogPayload = {
  status: 'read',
  startedAt: null,
  finishedAt: null,
  rating: null,
  loved: false,
  reviewText: '',
  containsSpoilers: false,
  dnfPage: null,
  dnfReason: null,
  isReread: false,
}

const store = () => useLibrary.getState()
const entry = (id: string) => store().entries[id]

beforeEach(() => {
  localStorage.clear()
  useLibrary.setState({
    entries: structuredClone(LIBRARY_SEED),
    history: structuredClone(HISTORY_SEED),
    shelves: structuredClone(SHELVES_SEED),
    wantOrder: [...WANT_ORDER_SEED],
  })
})

describe('library store', () => {
  it('counts a reread when a Read book goes back to Reading', () => {
    expect(entry('six-of-crows').rereads).toBe(0)
    store().setStatus('six-of-crows', 'reading')
    expect(entry('six-of-crows')).toMatchObject({ status: 'reading', rereads: 1, currentPage: 0 })
  })

  it('restores the full entry on Undo after Remove from shelves', () => {
    const before = entry('the-song-of-achilles')
    expect(before).toMatchObject({ status: 'read', rating: 5, loved: true, finishedAt: '2026-08-27' })

    const snapshot = store().takeSnapshot()
    const challenge = () => getChallengeProgress(store().history, store().importedCountOnly).read
    expect(challenge()).toBe(38)
    store().setStatus('the-song-of-achilles', null)
    expect(entry('the-song-of-achilles')).toBeUndefined()
    // Its journal events go too, so it no longer counts toward the challenge
    expect(store().history.some((e) => e.bookId === 'the-song-of-achilles')).toBe(false)
    expect(challenge()).toBe(37)

    store().restoreSnapshot(snapshot)
    expect(entry('the-song-of-achilles')).toEqual(before)
    expect(store().history).toEqual(HISTORY_SEED)
    expect(challenge()).toBe(38)
  })

  it('Undo of a log on a previously unshelved book removes it again', () => {
    const snapshot = store().entries['a-court-of-thorns-and-roses']
    expect(snapshot).toBeUndefined()
    store().logBook('a-court-of-thorns-and-roses', { ...basePayload, status: 'reading' })
    expect(entry('a-court-of-thorns-and-roses').status).toBe('reading')
    store().restoreEntry('a-court-of-thorns-and-roses', snapshot)
    expect(entry('a-court-of-thorns-and-roses')).toBeUndefined()
  })

  describe('rule H5: review text', () => {
    it('is not saved for an unpublished book', () => {
      store().logBook('iron-widow', { ...basePayload, status: 'want', reviewText: 'Hype!' })
      expect(entry('iron-widow').reviewText).toBeNull()
      // Even if something tries to mark it Read
      store().logBook('iron-widow', { ...basePayload, status: 'read', reviewText: 'Hype!' })
      expect(entry('iron-widow').reviewText).toBeNull()
    })

    it.each(['want', 'reading'] as const)('is not saved while the status is %s', (status) => {
      store().logBook('babel', { ...basePayload, status, reviewText: 'So far so good' })
      expect(entry('babel').reviewText).toBeNull()
    })

    it('is saved for a published book marked Read or DNF', () => {
      store().logBook('fourth-wing', { ...basePayload, status: 'read', reviewText: '  Loved it  ', containsSpoilers: true })
      expect(entry('fourth-wing')).toMatchObject({ reviewText: 'Loved it', containsSpoilers: true })

      store().logBook('babel', { ...basePayload, status: 'dnf', reviewText: 'Not for me', dnfPage: 120 })
      expect(entry('babel')).toMatchObject({ reviewText: 'Not for me', dnfPage: 120, currentPage: 120 })
    })
  })

  describe('reading challenge', () => {
    it('starts at 38 for the seed', () => {
      expect(getChallengeProgress(store().history, store().importedCountOnly).read).toBe(38)
    })

    it('does not count DNF', () => {
      store().logBook('fourth-wing', { ...basePayload, status: 'dnf', finishedAt: todayISO(), dnfPage: 312 })
      expect(entry('fourth-wing').status).toBe('dnf')
      expect(getChallengeProgress(store().history, store().importedCountOnly).read).toBe(38)
    })

    it('counts a book finished this year', () => {
      store().logBook('fourth-wing', { ...basePayload, status: 'read', finishedAt: '2026-10-15', rating: 4.25 })
      expect(getChallengeProgress(store().history, store().importedCountOnly).read).toBe(39)
      expect(entry('fourth-wing')).toMatchObject({ rating: 4.25, everRead: true })
    })
  })
})
