export type Review = {
  id: string
  bookId: string
  author: {
    name: string
    avatarUrl: string | null
    /** Followed by the current user (powers the Friends filter) */
    isFriend: boolean
  }
  /** Reviewer's own rating, 0–5 in 0.25 steps */
  rating: number | null
  loved: boolean
  text: string
  containsSpoilers: boolean
  verifiedRead: boolean
  likes: number
  replies: number
  /** ISO date */
  postedAt: string
}
