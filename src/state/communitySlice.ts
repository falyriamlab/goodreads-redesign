import { canSend } from '@/lib/community'
import { nowISO } from '@/lib/date'
import { FOLLOWING_SEED, JOINED_BUDDY_READS_SEED, JOINED_GROUPS_SEED } from '@/mocks/community'
import { ME, type BuddyComment, type GroupReply, type GroupThread, type Message } from '@/types/community'

export type CommunityState = {
  /** User ids Sofía follows (the profile Follow button and Find friends share it) */
  following: string[]
  follow: (userId: string) => void
  unfollow: (userId: string) => void

  /** Like keys, see likeKey(): "activity:a01", "review:fw-1", "comment:bc04", "thread:t-rg-1", "reply:r03" */
  likes: string[]
  toggleLike: (key: string) => void

  /** Comments Sofía posted in buddy reads (seed comments live in the mocks) */
  buddyComments: BuddyComment[]
  postBuddyComment: (input: Pick<BuddyComment, 'buddyReadId' | 'chapter' | 'text' | 'containsSpoilers'>) => BuddyComment | null
  joinedBuddyReads: string[]
  joinBuddyRead: (id: string) => void
  leaveBuddyRead: (id: string) => void

  joinedGroups: string[]
  joinGroup: (id: string) => void
  leaveGroup: (id: string) => void
  postedThreads: GroupThread[]
  /** Returns the new thread's id, or null if the title or body is empty */
  createThread: (groupId: string, title: string, body: string) => string | null
  postedReplies: GroupReply[]
  postReply: (threadId: string, text: string) => GroupReply | null

  /** Sent by Sofía; there are no automatic replies */
  sentMessages: Message[]
  sendMessage: (conversationId: string, text: string, bookId?: string) => Message | null
  readConversations: string[]
  markConversationRead: (id: string) => void

  /** Opened notifications (seed ones can also start read) */
  readNotifications: string[]
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: (ids: string[]) => void
}

export const COMMUNITY_SEED = {
  following: FOLLOWING_SEED,
  likes: [] as string[],
  buddyComments: [] as BuddyComment[],
  joinedBuddyReads: JOINED_BUDDY_READS_SEED,
  joinedGroups: JOINED_GROUPS_SEED,
  postedThreads: [] as GroupThread[],
  postedReplies: [] as GroupReply[],
  sentMessages: [] as Message[],
  readConversations: [] as string[],
  readNotifications: [] as string[],
}

export type CommunityData = typeof COMMUNITY_SEED

let counter = 0
const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${(counter++).toString(36)}`

const add = (list: string[], id: string) => (list.includes(id) ? list : [...list, id])
const remove = (list: string[], id: string) => list.filter((x) => x !== id)

type Set = (fn: (state: CommunityState) => Partial<CommunityState>) => void

export function createCommunitySlice(set: Set): CommunityState {
  return {
    ...COMMUNITY_SEED,

    follow: (userId) => set((s) => ({ following: add(s.following, userId) })),
    unfollow: (userId) => set((s) => ({ following: remove(s.following, userId) })),

    toggleLike: (key) => set((s) => ({ likes: s.likes.includes(key) ? remove(s.likes, key) : [...s.likes, key] })),

    postBuddyComment: ({ buddyReadId, chapter, text, containsSpoilers }) => {
      const body = text.trim()
      if (!body) return null
      const comment: BuddyComment = {
        id: newId('bc'),
        buddyReadId,
        chapter,
        authorId: ME,
        text: body,
        createdAt: nowISO(),
        containsSpoilers,
      }
      set((s) => ({ buddyComments: [...s.buddyComments, comment] }))
      return comment
    },
    joinBuddyRead: (id) => set((s) => ({ joinedBuddyReads: add(s.joinedBuddyReads, id) })),
    leaveBuddyRead: (id) => set((s) => ({ joinedBuddyReads: remove(s.joinedBuddyReads, id) })),

    joinGroup: (id) => set((s) => ({ joinedGroups: add(s.joinedGroups, id) })),
    leaveGroup: (id) => set((s) => ({ joinedGroups: remove(s.joinedGroups, id) })),

    createThread: (groupId, title, body) => {
      if (!title.trim() || !body.trim()) return null
      const thread: GroupThread = {
        id: newId('t'),
        groupId,
        title: title.trim(),
        authorId: ME,
        body: body.trim(),
        createdAt: nowISO(),
      }
      set((s) => ({ postedThreads: [...s.postedThreads, thread] }))
      return thread.id
    },
    postReply: (threadId, text) => {
      if (!text.trim()) return null
      const reply: GroupReply = { id: newId('r'), threadId, authorId: ME, text: text.trim(), createdAt: nowISO() }
      set((s) => ({ postedReplies: [...s.postedReplies, reply] }))
      return reply
    },

    sendMessage: (conversationId, text, bookId) => {
      if (!canSend(text, bookId)) return null
      const message: Message = {
        id: newId('m'),
        conversationId,
        fromId: ME,
        text: text.trim(),
        ...(bookId ? { bookId } : {}),
        sentAt: nowISO(),
      }
      set((s) => ({ sentMessages: [...s.sentMessages, message] }))
      return message
    },
    markConversationRead: (id) => set((s) => ({ readConversations: add(s.readConversations, id) })),

    markNotificationRead: (id) => set((s) => ({ readNotifications: add(s.readNotifications, id) })),
    markAllNotificationsRead: (ids) => set((s) => ({ readNotifications: [...new Set([...s.readNotifications, ...ids])] })),
  }
}

/** Persisted community fields, with seeds for anything missing (migration to v7) */
export function migrateCommunity(state: Partial<CommunityData>): CommunityData {
  return Object.fromEntries(
    Object.entries(COMMUNITY_SEED).map(([key, seed]) => [key, state[key as keyof CommunityData] ?? seed]),
  ) as CommunityData
}
