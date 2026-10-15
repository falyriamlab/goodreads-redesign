import type { User } from '@/types/user'

export const currentUser: User = {
  id: 'sofia-herrera',
  name: 'Sofía Herrera',
  challenge: {
    year: 2026,
    goal: 60,
    read: 38,
  },
  currentlyReading: [{ bookId: 'fourth-wing', currentPage: 312 }],
}
