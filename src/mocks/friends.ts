// MOCK DATA: fictional friends of Sofía (no real people). Avatars are initials only.
export type FriendActivity = {
  id: string
  name: string
  bookId: string
} & ({ status: 'reading'; rating: null } | { status: 'read'; rating: number })

export const friends: FriendActivity[] = [
  { id: 'maya-chen', name: 'Maya Chen', bookId: 'onyx-storm', status: 'reading', rating: null },
  { id: 'jordan-ruiz', name: 'Jordan Ruiz', bookId: 'babel', status: 'read', rating: 4.5 },
  { id: 'lucia-gomez', name: 'Lucía Gómez', bookId: 'a-court-of-thorns-and-roses', status: 'reading', rating: null },
  { id: 'theo-park', name: 'Theo Park', bookId: 'six-of-crows', status: 'read', rating: 4 },
]
