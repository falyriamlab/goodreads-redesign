// MOCK DATA: one buddy read Sofía has joined
export type BuddyRead = {
  id: string
  bookId: string
  chapters: string
  participants: number
}

export const buddyReads: BuddyRead[] = [{ id: 'br-1', bookId: 'fourth-wing', chapters: 'ch. 1–10', participants: 6 }]
