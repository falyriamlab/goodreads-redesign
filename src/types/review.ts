export type Review = {
  id: string
  bookId: string
  author: {
    name: string
    avatarUrl: string | null
  }
  /** Reviewer's own rating, 0–5 in 0.25 steps */
  rating: number | null
  loved: boolean
  text: string
  containsSpoilers: boolean
  verifiedRead: boolean
  likes: number
  replies: number
  /** Relative label for now, e.g. "2d" */
  postedAgo: string
}
