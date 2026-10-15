import type { Review } from '@/types/review'

// Mock reviews from fictional users (dev/testing only)
export const reviews: Review[] = [
  {
    id: 'r1',
    bookId: 'fourth-wing',
    author: { name: 'Maya Chen', avatarUrl: null },
    rating: 4.25,
    loved: true,
    text: 'Okay so I went in expecting a fun dragon romp and came out emotionally compromised. The pacing in the first half is relentless, the war college setting gives every chapter real stakes, and the banter carries the slower stretches. Some of the worldbuilding gets info-dumped, and a couple of side characters deserved more page time, but I stayed up way too late finishing it and immediately ordered the sequel. The dragons alone are worth the hype.',
    containsSpoilers: false,
    verifiedRead: true,
    likes: 128,
    replies: 14,
    postedAgo: '2d',
  },
  {
    id: 'r2',
    bookId: 'fourth-wing',
    author: { name: 'Jordan Ruiz', avatarUrl: null },
    rating: 3.5,
    loved: false,
    text: 'That ending reframes everything you thought you knew about the war and the wards. I need to talk about the final chapter with literally anyone.',
    containsSpoilers: true,
    verifiedRead: true,
    likes: 42,
    replies: 7,
    postedAgo: '1w',
  },
  {
    id: 'r3',
    bookId: 'fourth-wing',
    author: { name: 'Priya Nair', avatarUrl: null },
    rating: null,
    loved: false,
    text: 'DNF at 40%. Not my vibe, but I get why people love it.',
    containsSpoilers: false,
    verifiedRead: false,
    likes: 3,
    replies: 1,
    postedAgo: '3w',
  },
]
