import { beforeEach, describe, expect, it } from 'vitest'
import { books } from '@/mocks/books'
import { activities, buddyComments, conversations, FOLLOWING_SEED, getConversation, notifications } from '@/mocks/community'
import { COMMUNITY_SEED } from '@/state/communitySlice'
import { HISTORY_SEED, IMPORTED_COUNT_ONLY_SEED, LIBRARY_SEED, useLibrary } from '@/state/library'
import { ME } from '@/types/community'
import { detailNote, getChallengeProgress } from './challenge'
import {
  canSend,
  chapterFromPage,
  conversationMessages,
  currentChapter,
  filterFeed,
  groupCommentsByChapter,
  likeCount,
  likeKey,
  splitNotifications,
  unreadConversationCount,
  unreadNotificationCount,
} from './community'

const store = () => useLibrary.getState()
const fourthWing = books.find((b) => b.id === 'fourth-wing')!

beforeEach(() => {
  localStorage.clear()
  useLibrary.setState({
    entries: structuredClone(LIBRARY_SEED),
    history: structuredClone(HISTORY_SEED),
    importedCountOnly: IMPORTED_COUNT_ONLY_SEED,
    ...structuredClone(COMMUNITY_SEED),
  })
})

describe('challenge with count-only imports', () => {
  it('adds journal finishes and count-only imports: 12 + 26 = 38', () => {
    const c = getChallengeProgress(HISTORY_SEED, IMPORTED_COUNT_ONLY_SEED)
    expect(c).toMatchObject({ read: 38, detailed: 12, countOnly: 26 })
    expect(detailNote(c.detailed, c.countOnly)).toBe('Based on 12 books with full details · 26 imported as count only.')
  })
})

describe('chapter from page', () => {
  it('maps pages to chapters linearly (an approximation)', () => {
    // Fourth Wing: 518 pages, 39 chapters. p.312 → 312/518 × 39 = 23.5 → chapter 24
    expect(chapterFromPage(312, 518, 39)).toBe(24)
    expect(chapterFromPage(0, 518, 39)).toBe(1)
    expect(chapterFromPage(13, 518, 39)).toBe(1)
    expect(chapterFromPage(14, 518, 39)).toBe(2)
  })

  it('clamps to the first and last chapter', () => {
    expect(chapterFromPage(518, 518, 39)).toBe(39)
    expect(chapterFromPage(9999, 518, 39)).toBe(39)
    expect(chapterFromPage(-5, 518, 39)).toBe(1)
    expect(chapterFromPage(100, 0, 39)).toBe(1)
  })

  it('uses your shelf: finished = last chapter, not started = chapter 1', () => {
    expect(currentChapter(fourthWing, LIBRARY_SEED['fourth-wing'])).toBe(24)
    expect(currentChapter(fourthWing, { ...LIBRARY_SEED['fourth-wing'], status: 'read' })).toBe(39)
    expect(currentChapter(fourthWing, undefined)).toBe(1)
  })
})

describe('spoiler protection by progress', () => {
  const fw = buddyComments.filter((c) => c.buddyReadId === 'br-fourth-wing')

  it('hides chapters after yours and shows yours and earlier ones', () => {
    const groups = groupCommentsByChapter(fw, 24)
    const visible = groups.filter((g) => !g.ahead).map((g) => g.chapter)
    const hidden = groups.filter((g) => g.ahead).map((g) => g.chapter)
    expect(visible).toEqual([3, 8, 15, 22, 24])
    expect(hidden).toEqual([27, 31])
    // Your own chapter is never hidden
    expect(groups.find((g) => g.chapter === 24)?.ahead).toBe(false)
  })

  it('opens up as you read further', () => {
    expect(groupCommentsByChapter(fw, 39).every((g) => !g.ahead)).toBe(true)
    expect(groupCommentsByChapter(fw, 1).filter((g) => !g.ahead)).toHaveLength(0)
  })

  it('groups by chapter in order, oldest comment first', () => {
    const ch24 = groupCommentsByChapter(fw, 24).find((g) => g.chapter === 24)!
    expect(ch24.comments.map((c) => c.id)).toEqual(['bc05', 'bc06'])
  })
})

describe('notifications', () => {
  it('counts unread and splits New / Earlier', () => {
    expect(unreadNotificationCount(notifications, [])).toBe(3)
    const { fresh, earlier } = splitNotifications(notifications, ['n1'])
    expect(fresh.map((n) => n.id)).toEqual(['n2', 'n3'])
    expect(earlier[0].id).toBe('n1')
  })

  it('opening one marks it read; "Mark all as read" clears the badge', () => {
    store().markNotificationRead('n1')
    expect(unreadNotificationCount(notifications, store().readNotifications)).toBe(2)
    store().markAllNotificationsRead(notifications.map((n) => n.id))
    expect(unreadNotificationCount(notifications, store().readNotifications)).toBe(0)
    expect(new Set(store().readNotifications).size).toBe(store().readNotifications.length)
  })
})

describe('feed filters', () => {
  it('only shows people you follow, newest first', () => {
    const all = filterFeed(activities, 'all', FOLLOWING_SEED)
    expect(all.every((a) => FOLLOWING_SEED.includes(a.userId))).toBe(true)
    expect(all.map((a) => a.createdAt)).toEqual([...all.map((a) => a.createdAt)].sort().reverse())
    expect(all.some((a) => a.userId === 'priya-nair')).toBe(false)
  })

  it('narrows by type', () => {
    expect(filterFeed(activities, 'reviews', FOLLOWING_SEED).every((a) => a.type === 'reviewed')).toBe(true)
    expect(filterFeed(activities, 'finished', FOLLOWING_SEED).every((a) => a.type === 'finished')).toBe(true)
    const lists = filterFeed(activities, 'lists', FOLLOWING_SEED)
    expect(lists.length).toBeGreaterThan(0)
    expect(lists.every((a) => a.type === 'created_list' || a.type === 'added_to_shelf')).toBe(true)
  })

  it('is empty when you follow nobody, and grows when you follow someone', () => {
    expect(filterFeed(activities, 'all', [])).toEqual([])
    store().follow('priya-nair')
    expect(filterFeed(activities, 'all', store().following).some((a) => a.userId === 'priya-nair')).toBe(true)
  })
})

describe('messages', () => {
  it('sends a text message that persists in the store', () => {
    const maya = getConversation('c-maya')!
    const before = conversationMessages(maya, store().sentMessages).length
    const sent = store().sendMessage('c-maya', '  On it!  ')
    expect(sent).toMatchObject({ fromId: ME, text: 'On it!', conversationId: 'c-maya' })
    const after = conversationMessages(maya, store().sentMessages)
    expect(after).toHaveLength(before + 1)
    expect(after.at(-1)?.id).toBe(sent!.id)
    // Persisted under the library key
    expect(localStorage.getItem('goodreads-library')).toContain('On it!')
  })

  it('sends a shared book with no text', () => {
    const sent = store().sendMessage('c-jordan', '', 'babel')
    expect(sent).toMatchObject({ text: '', bookId: 'babel' })
    expect(conversationMessages(getConversation('c-jordan')!, store().sentMessages).at(-1)?.bookId).toBe('babel')
  })

  it('refuses empty messages and never auto-replies', () => {
    expect(canSend('   ')).toBe(false)
    expect(store().sendMessage('c-maya', '   ')).toBeNull()
    store().sendMessage('c-maya', 'Hello?')
    expect(store().sentMessages.every((m) => m.fromId === ME)).toBe(true)
  })

  it('opening a conversation clears its unread state', () => {
    expect(unreadConversationCount(conversations, store().readConversations)).toBe(2)
    store().markConversationRead('c-maya')
    expect(unreadConversationCount(conversations, store().readConversations)).toBe(1)
  })
})

describe('likes', () => {
  it('toggles on and off and adds one to the count', () => {
    const key = likeKey('activity', 'a10')
    store().toggleLike(key)
    expect(store().likes).toContain(key)
    expect(likeCount(12, store().likes.includes(key))).toBe(13)
    store().toggleLike(key)
    expect(store().likes).not.toContain(key)
    expect(likeCount(12, store().likes.includes(key))).toBe(12)
  })

  it('keeps separate keys for reviews, comments and replies', () => {
    store().toggleLike(likeKey('review', 'fw-1'))
    store().toggleLike(likeKey('comment', 'bc04'))
    expect(store().likes).toEqual(['review:fw-1', 'comment:bc04'])
  })
})

describe('groups and buddy reads', () => {
  it('joins and leaves groups', () => {
    expect(store().joinedGroups).not.toContain('thriller-thursdays')
    store().joinGroup('thriller-thursdays')
    store().joinGroup('thriller-thursdays')
    expect(store().joinedGroups.filter((id) => id === 'thriller-thursdays')).toHaveLength(1)
    store().leaveGroup('thriller-thursdays')
    expect(store().joinedGroups).not.toContain('thriller-thursdays')
  })

  it('joins and leaves buddy reads', () => {
    expect(store().joinedBuddyReads).toEqual(['br-fourth-wing'])
    store().joinBuddyRead('br-evelyn-hugo')
    expect(store().joinedBuddyReads).toContain('br-evelyn-hugo')
    store().leaveBuddyRead('br-fourth-wing')
    expect(store().joinedBuddyReads).toEqual(['br-evelyn-hugo'])
  })

  it('posts a buddy read comment in a chapter, with the spoiler flag', () => {
    const c = store().postBuddyComment({ buddyReadId: 'br-fourth-wing', chapter: 24, text: ' Same! ', containsSpoilers: true })
    expect(c).toMatchObject({ authorId: ME, chapter: 24, text: 'Same!', containsSpoilers: true })
    expect(store().postBuddyComment({ buddyReadId: 'br-fourth-wing', chapter: 24, text: ' ', containsSpoilers: false })).toBeNull()
  })

  it('creates threads and replies', () => {
    const id = store().createThread('bogota-book-club', 'Swap list', 'What are you bringing?')
    expect(id).toBeTruthy()
    expect(store().createThread('bogota-book-club', '', 'body')).toBeNull()
    expect(store().postReply(id!, 'A thriller')).toMatchObject({ threadId: id, authorId: ME })
  })
})
