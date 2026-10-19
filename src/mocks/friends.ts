import type { ProfileSection } from '@/types/profile'

// MOCK DATA: fictional friends of Sofía (no real people). Avatars are initials only.
// Follower counts and reading totals are placeholders for the prototype.
export type FriendActivity = {
  id: string
  name: string
  handle: string
  city: string
  bio: string
  /** What shows on Home: their current book and status */
  bookId: string
  favorites: string[]
  loved: string[]
  readThisYear: number
  followers: number
  following: number
  publicSections: Record<ProfileSection, boolean>
  lists: { id: string; name: string; bookIds: string[] }[]
  recentlyFinished: { bookId: string; date: string; rating: number | null }[]
} & ({ status: 'reading'; rating: null } | { status: 'read'; rating: number })

export const friends: FriendActivity[] = [
  {
    id: 'maya-chen',
    name: 'Maya Chen',
    handle: 'mayareadsdragons',
    city: 'Toronto',
    bio: 'Dragon rider in my dreams, product designer in real life.',
    bookId: 'onyx-storm',
    status: 'reading',
    rating: null,
    favorites: ['fourth-wing', 'the-song-of-achilles', 'six-of-crows', 'a-court-of-mist-and-fury'],
    loved: ['fourth-wing', 'the-song-of-achilles'],
    readThisYear: 41,
    followers: 312,
    following: 188,
    publicSections: { reviews: true, lists: true, journal: false, stats: true },
    lists: [{ id: 'm1', name: 'Comfort rereads', bookIds: ['the-song-of-achilles', 'six-of-crows', 'beach-read'] }],
    recentlyFinished: [{ bookId: 'iron-flame', date: '2026-10-08', rating: 4.5 }],
  },
  {
    id: 'jordan-ruiz',
    name: 'Jordan Ruiz',
    handle: 'jordanreads',
    city: 'Ciudad de México',
    bio: 'Spoiler-free zone. Mostly.',
    bookId: 'babel',
    status: 'read',
    rating: 4.5,
    favorites: ['babel', 'dune', 'project-hail-mary'],
    loved: ['project-hail-mary'],
    readThisYear: 22,
    followers: 87,
    following: 140,
    publicSections: { reviews: true, lists: false, journal: true, stats: false },
    lists: [],
    recentlyFinished: [
      { bookId: 'babel', date: '2026-10-11', rating: 4.5 },
      { bookId: 'the-martian', date: '2026-09-20', rating: 4 },
    ],
  },
  {
    id: 'lucia-gomez',
    name: 'Lucía Gómez',
    handle: 'luciagomez',
    city: 'Bogotá',
    bio: 'Fae courts and found families.',
    bookId: 'a-court-of-thorns-and-roses',
    status: 'reading',
    rating: null,
    favorites: ['circe', 'the-cruel-prince'],
    loved: ['circe'],
    readThisYear: 17,
    followers: 54,
    following: 61,
    publicSections: { reviews: false, lists: true, journal: true, stats: true },
    lists: [{ id: 'l1', name: 'Fae season', bookIds: ['the-cruel-prince', 'a-court-of-thorns-and-roses', 'circe'] }],
    recentlyFinished: [{ bookId: 'the-cruel-prince', date: '2026-10-02', rating: 4 }],
  },
  {
    id: 'theo-park',
    name: 'Theo Park',
    handle: 'theopark',
    city: 'Seoul',
    bio: 'Heists, spaceships, and the occasional cry read.',
    bookId: 'six-of-crows',
    status: 'read',
    rating: 4,
    favorites: ['six-of-crows', 'the-martian', 'red-rising', 'project-hail-mary'],
    loved: ['the-martian'],
    readThisYear: 29,
    followers: 120,
    following: 98,
    publicSections: { reviews: true, lists: true, journal: false, stats: false },
    lists: [{ id: 't1', name: 'Space nerd starter pack', bookIds: ['the-martian', 'project-hail-mary', 'dune'] }],
    recentlyFinished: [{ bookId: 'six-of-crows', date: '2026-10-03', rating: 4 }],
  },
]

export function getFriendByHandle(handle: string): FriendActivity | undefined {
  return friends.find((f) => f.handle === handle)
}
