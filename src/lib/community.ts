import type { Book } from '@/types/book'
import type {
  Activity,
  AppNotification,
  BuddyComment,
  BuddyRead,
  Conversation,
  FeedFilter,
  Message,
} from '@/types/community'
import type { LibraryEntry } from '@/types/library'

/* ---------- Chapters ---------- */

/**
 * Chapter you're on, from your page.
 * APPROXIMATION: assumes chapters are the same length (linear page → chapter), since we only
 * know the total page and chapter counts. Real chapters vary, so this can be off by one or two.
 */
export function chapterFromPage(page: number, pages: number, chapterCount: number): number {
  if (chapterCount <= 1 || pages <= 0) return 1
  const chapter = Math.floor((Math.max(0, page) / pages) * chapterCount) + 1
  return Math.min(chapterCount, Math.max(1, chapter))
}

/** Your chapter in a buddy read's book: finished = last chapter; not started = chapter 1 */
export function currentChapter(book: Book, entry: LibraryEntry | undefined): number {
  const count = book.chapterCount ?? 1
  if (entry?.status === 'read') return count
  return chapterFromPage(entry?.currentPage ?? 0, book.pages, count)
}

export type ChapterGroup = {
  chapter: number
  comments: BuddyComment[]
  /** Later than your chapter: collapsed until revealed */
  ahead: boolean
}

/**
 * Spoiler protection by progress: comments are grouped by chapter (ascending, oldest first inside)
 * and every chapter after yours is marked `ahead`, so the UI collapses it.
 */
export function groupCommentsByChapter(comments: BuddyComment[], myChapter: number): ChapterGroup[] {
  const byChapter = new Map<number, BuddyComment[]>()
  for (const c of comments) byChapter.set(c.chapter, [...(byChapter.get(c.chapter) ?? []), c])
  return [...byChapter.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([chapter, list]) => ({
      chapter,
      comments: [...list].sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
      ahead: chapter > myChapter,
    }))
}

/** "You're on Ch. 24 of 39" / "On your Want to read" / "Not started" */
export function progressLabel(book: Book, entry: LibraryEntry | undefined): string {
  if (entry?.status === 'read') return 'You finished it'
  if (entry?.status === 'reading') return `You're on Ch. ${currentChapter(book, entry)} of ${book.chapterCount}`
  if (entry?.status === 'want') return 'On your Want to read'
  return 'Not started'
}

export const spanLabel = (span: { from: number; to: number }) => `Ch. ${span.from}–${span.to}`

/** Readers in a buddy read, counting Sofía when she has joined */
export const buddyReaderCount = (br: BuddyRead, joined: boolean) => br.participantIds.length + (joined ? 1 : 0)

/* ---------- Feed ---------- */

const FILTER_TYPES: Record<Exclude<FeedFilter, 'all'>, Activity['type'][]> = {
  reviews: ['reviewed'],
  finished: ['finished'],
  lists: ['created_list', 'added_to_shelf'],
}

/** Activity from people you follow, newest first, narrowed by the feed filter */
export function filterFeed(activities: Activity[], filter: FeedFilter, following: string[]): Activity[] {
  return activities
    .filter((a) => following.includes(a.userId))
    .filter((a) => filter === 'all' || FILTER_TYPES[filter].includes(a.type))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

/* ---------- Likes ---------- */

export type LikeKind = 'activity' | 'review' | 'comment' | 'thread' | 'reply'
export const likeKey = (kind: LikeKind, id: string) => `${kind}:${id}`

/** Seed count from others + 1 if you liked it */
export const likeCount = (base: number, liked: boolean) => base + (liked ? 1 : 0)

/* ---------- Notifications ---------- */

export const isNotificationRead = (n: AppNotification, readIds: string[]) => n.read || readIds.includes(n.id)

export function unreadNotificationCount(list: AppNotification[], readIds: string[]): number {
  return list.filter((n) => !isNotificationRead(n, readIds)).length
}

/** "New" (unread) and "Earlier", each newest first */
export function splitNotifications(list: AppNotification[], readIds: string[]) {
  const sorted = [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  return {
    fresh: sorted.filter((n) => !isNotificationRead(n, readIds)),
    earlier: sorted.filter((n) => isNotificationRead(n, readIds)),
  }
}

/* ---------- Messages ---------- */

/** Seed messages plus the ones you sent, in order */
export function conversationMessages(conversation: Conversation, sent: Message[]): Message[] {
  return [...conversation.messages, ...sent.filter((m) => m.conversationId === conversation.id)].sort((a, b) =>
    a.sentAt.localeCompare(b.sentAt),
  )
}

/** A conversation is unread until you open it (no automatic replies, so it never becomes unread again) */
export const isConversationUnread = (c: Conversation, readIds: string[]) => c.unread && !readIds.includes(c.id)

export function unreadConversationCount(list: Conversation[], readIds: string[]): number {
  return list.filter((c) => isConversationUnread(c, readIds)).length
}

/** Trims; a message needs text or a book */
export function canSend(text: string, bookId?: string): boolean {
  return text.trim().length > 0 || Boolean(bookId)
}
