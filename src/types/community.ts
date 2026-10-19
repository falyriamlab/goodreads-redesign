/** Sofía's id in community data (messages, comments, likes she authors) */
export const ME = 'sofia-herrera'

export type CommunityUser = {
  id: string
  name: string
  /** Without the @ */
  handle: string
  bio: string
}

export type ActivityType =
  | 'finished'
  | 'started'
  | 'rated'
  | 'reviewed'
  | 'added_to_shelf'
  | 'created_list'
  | 'buddy_read_post'

export type Activity = {
  id: string
  userId: string
  type: ActivityType
  /** The book the event is about (the first book for a new list) */
  bookId: string
  /** finished / rated / reviewed */
  rating?: number | null
  /** reviewed: the review in mocks/reviews (shares its likes) or inline text */
  reviewId?: string
  reviewText?: string
  containsSpoilers?: boolean
  /** added_to_shelf / created_list */
  shelfName?: string
  listBookIds?: string[]
  /** buddy_read_post */
  buddyReadId?: string
  chapter?: number
  /** ISO date-time */
  createdAt: string
  /** Likes from other people (Sofía's like is added on top) */
  likes: number
}

export type FeedFilter = 'all' | 'reviews' | 'finished' | 'lists'

/** A reading schedule slice, e.g. Ch. 21–30 */
export type ChapterSpan = { from: number; to: number }

export type BuddyRead = {
  id: string
  bookId: string
  hostId: string
  /** Other readers (Sofía is counted separately, from the store) */
  participantIds: string[]
  /** The stretch everyone is reading this week */
  currentSpan: ChapterSpan
}

export type BuddyComment = {
  id: string
  buddyReadId: string
  chapter: number
  authorId: string
  text: string
  /** ISO date-time */
  createdAt: string
  containsSpoilers: boolean
  /** Seed likes from others */
  likes?: number
}

export type GroupReply = {
  id: string
  threadId: string
  authorId: string
  text: string
  createdAt: string
  likes?: number
}

export type GroupThread = {
  id: string
  groupId: string
  title: string
  authorId: string
  body: string
  createdAt: string
  likes?: number
}

export type Group = {
  id: string
  name: string
  description: string
  /** Members other than Sofía */
  memberCount: number
}

export type Message = {
  id: string
  conversationId: string
  /** ME or the other person's id */
  fromId: string
  /** Empty when the message is only a shared book */
  text: string
  bookId?: string
  sentAt: string
}

export type Conversation = {
  id: string
  userId: string
  /** Seed messages; Sofía's sent ones live in the store */
  messages: Message[]
  /** Seed state: the last incoming messages haven't been seen */
  unread: boolean
}

export type NotificationType = 'reply' | 'review_like' | 'friend_finished' | 'buddy_comments' | 'new_release'

export type AppNotification = {
  id: string
  type: NotificationType
  /** Who did it (none for a new release) */
  actorId?: string
  bookId?: string
  text: string
  href: string
  createdAt: string
  /** Seed state; opened ones are tracked in the store */
  read: boolean
}
