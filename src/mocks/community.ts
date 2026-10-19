import type {
  Activity,
  AppNotification,
  BuddyComment,
  BuddyRead,
  CommunityUser,
  Conversation,
  Group,
  GroupReply,
  GroupThread,
} from '@/types/community'
import { ME } from '@/types/community'
import { friends, type FriendActivity } from './friends'

// MOCK DATA: a fictional reading community around Sofía. Every person, post, comment and message
// here was written for this prototype; none of it comes from real people or real Goodreads content.
// Avatars are initials only. Like counts and member counts are placeholders.

/* ---------- People ---------- */

// Four more readers Sofía doesn't follow yet (the reviewers from mocks/reviews.ts)
export const otherReaders: FriendActivity[] = [
  {
    id: 'priya-nair',
    name: 'Priya Nair',
    handle: 'priya_reads',
    city: 'Pune',
    bio: 'Will annotate anything. Romantasy on weekdays, rom-coms on weekends.',
    bookId: 'the-love-hypothesis',
    status: 'read',
    rating: 4,
    favorites: ['fourth-wing', 'the-love-hypothesis', 'circe'],
    loved: ['fourth-wing'],
    readThisYear: 63,
    followers: 904,
    following: 210,
    publicSections: { reviews: true, lists: true, journal: true, stats: true },
    lists: [{ id: 'p1', name: 'Annotate with me', bookIds: ['fourth-wing', 'circe', 'the-love-hypothesis'] }],
    recentlyFinished: [{ bookId: 'the-love-hypothesis', date: '2026-10-14', rating: 4 }],
  },
  {
    id: 'leo-martins',
    name: 'Leo Martins',
    handle: 'leo_martins',
    city: 'Lisbon',
    bio: 'Big sci-fi, small apartment. Library card power user.',
    bookId: 'dune',
    status: 'reading',
    rating: null,
    favorites: ['dune', 'red-rising', 'the-martian'],
    loved: ['dune'],
    readThisYear: 19,
    followers: 66,
    following: 73,
    publicSections: { reviews: true, lists: false, journal: false, stats: false },
    lists: [],
    recentlyFinished: [],
  },
  {
    id: 'amara-okafor',
    name: 'Amara Okafor',
    handle: 'amarareads',
    city: 'Lagos',
    bio: 'Crying over fictional people since forever.',
    bookId: 'the-seven-husbands-of-evelyn-hugo',
    status: 'read',
    rating: 4.75,
    favorites: ['the-seven-husbands-of-evelyn-hugo', 'the-song-of-achilles', 'daisy-jones-and-the-six'],
    loved: ['the-seven-husbands-of-evelyn-hugo', 'the-song-of-achilles'],
    readThisYear: 35,
    followers: 410,
    following: 150,
    publicSections: { reviews: true, lists: true, journal: false, stats: true },
    lists: [],
    recentlyFinished: [{ bookId: 'the-seven-husbands-of-evelyn-hugo', date: '2026-10-12', rating: 4.75 }],
  },
  {
    id: 'sam-whitfield',
    name: 'Sam Whitfield',
    handle: 'samlistens',
    city: 'Manchester',
    bio: 'Audiobooks on the commute, paperbacks on the couch.',
    bookId: 'the-silent-patient',
    status: 'read',
    rating: 4,
    favorites: ['the-martian', 'the-silent-patient'],
    loved: [],
    readThisYear: 48,
    followers: 132,
    following: 201,
    publicSections: { reviews: true, lists: true, journal: true, stats: false },
    lists: [{ id: 's1', name: 'Commute audiobooks', bookIds: ['the-martian', 'project-hail-mary', 'the-silent-patient'] }],
    recentlyFinished: [{ bookId: 'the-silent-patient', date: '2026-10-05', rating: 4 }],
  },
]

/** Everyone with a public profile: Sofía's 4 friends + 4 more readers */
export const readers: FriendActivity[] = [...friends, ...otherReaders]

export const communityUsers: CommunityUser[] = readers.map(({ id, name, handle, bio }) => ({ id, name, handle, bio }))

/** Followed in the seed (the friends from Home) */
export const FOLLOWING_SEED = friends.map((f) => f.id)

export function getReader(id: string): FriendActivity | undefined {
  return readers.find((r) => r.id === id)
}

export function getReaderByHandle(handle: string): FriendActivity | undefined {
  return readers.find((r) => r.handle === handle)
}

/* ---------- Activity (Oct 2–16, 2026) ---------- */

export const activities: Activity[] = [
  { id: 'a01', userId: 'priya-nair', type: 'buddy_read_post', bookId: 'the-seven-husbands-of-evelyn-hugo', buddyReadId: 'br-evelyn-hugo', chapter: 8, createdAt: '2026-10-16T08:05:00', likes: 2 },
  { id: 'a02', userId: 'maya-chen', type: 'buddy_read_post', bookId: 'fourth-wing', buddyReadId: 'br-fourth-wing', chapter: 22, createdAt: '2026-10-16T07:45:00', likes: 3 },
  { id: 'a03', userId: 'lucia-gomez', type: 'buddy_read_post', bookId: 'fourth-wing', buddyReadId: 'br-fourth-wing', chapter: 27, createdAt: '2026-10-15T21:30:00', likes: 1 },
  { id: 'a04', userId: 'theo-park', type: 'started', bookId: 'red-rising', createdAt: '2026-10-15T08:40:00', likes: 4 },
  { id: 'a05', userId: 'lucia-gomez', type: 'started', bookId: 'a-court-of-thorns-and-roses', createdAt: '2026-10-14T20:15:00', likes: 5 },
  { id: 'a06', userId: 'priya-nair', type: 'finished', bookId: 'the-love-hypothesis', rating: 4, createdAt: '2026-10-14T19:00:00', likes: 21 },
  { id: 'a07', userId: 'maya-chen', type: 'created_list', bookId: 'fourth-wing', shelfName: 'Dragons, ranked', listBookIds: ['fourth-wing', 'iron-flame', 'onyx-storm'], createdAt: '2026-10-13T18:05:00', likes: 17 },
  { id: 'a08', userId: 'maya-chen', type: 'reviewed', bookId: 'fourth-wing', reviewId: 'fw-1', rating: 4.25, createdAt: '2026-10-12T21:40:00', likes: 0 },
  {
    id: 'a09',
    userId: 'amara-okafor',
    type: 'reviewed',
    bookId: 'the-seven-husbands-of-evelyn-hugo',
    rating: 4.75,
    reviewText: 'The last act recontextualizes the whole interview, and the reason she chose this particular journalist hit me like a truck.',
    containsSpoilers: true,
    createdAt: '2026-10-12T20:00:00',
    likes: 58,
  },
  { id: 'a10', userId: 'jordan-ruiz', type: 'finished', bookId: 'babel', rating: 4.5, createdAt: '2026-10-11T22:05:00', likes: 12 },
  { id: 'a11', userId: 'leo-martins', type: 'started', bookId: 'dune', createdAt: '2026-10-11T08:00:00', likes: 2 },
  { id: 'a12', userId: 'lucia-gomez', type: 'added_to_shelf', bookId: 'iron-flame', shelfName: 'Want to read', createdAt: '2026-10-10T16:20:00', likes: 1 },
  { id: 'a13', userId: 'theo-park', type: 'created_list', bookId: 'the-martian', shelfName: 'Space nerd starter pack', listBookIds: ['the-martian', 'project-hail-mary', 'dune'], createdAt: '2026-10-09T12:30:00', likes: 9 },
  { id: 'a14', userId: 'sam-whitfield', type: 'created_list', bookId: 'the-martian', shelfName: 'Commute audiobooks', listBookIds: ['the-martian', 'project-hail-mary', 'the-silent-patient'], createdAt: '2026-10-09T07:50:00', likes: 6 },
  { id: 'a15', userId: 'maya-chen', type: 'finished', bookId: 'iron-flame', rating: 4.5, createdAt: '2026-10-08T23:10:00', likes: 24 },
  { id: 'a16', userId: 'jordan-ruiz', type: 'reviewed', bookId: 'fourth-wing', reviewId: 'fw-2', rating: 3.5, createdAt: '2026-10-07T19:30:00', likes: 0 },
  { id: 'a17', userId: 'jordan-ruiz', type: 'added_to_shelf', bookId: 'the-seven-husbands-of-evelyn-hugo', shelfName: 'Buddy reads', createdAt: '2026-10-06T14:00:00', likes: 3 },
  { id: 'a18', userId: 'jordan-ruiz', type: 'rated', bookId: 'dune', rating: 5, createdAt: '2026-10-05T10:00:00', likes: 8 },
  {
    id: 'a19',
    userId: 'theo-park',
    type: 'reviewed',
    bookId: 'six-of-crows',
    rating: 4,
    reviewText: 'Six disasters, one impossible job, zero chill. The crew banter carries it even when the plan gets convoluted.',
    containsSpoilers: false,
    createdAt: '2026-10-04T09:20:00',
    likes: 14,
  },
  { id: 'a20', userId: 'theo-park', type: 'finished', bookId: 'six-of-crows', rating: 4, createdAt: '2026-10-03T18:00:00', likes: 7 },
  { id: 'a21', userId: 'lucia-gomez', type: 'finished', bookId: 'the-cruel-prince', rating: 4, createdAt: '2026-10-02T21:00:00', likes: 11 },
]

/* ---------- Buddy reads ---------- */

export const buddyReads: BuddyRead[] = [
  {
    id: 'br-fourth-wing',
    bookId: 'fourth-wing',
    hostId: 'maya-chen',
    participantIds: ['maya-chen', 'lucia-gomez', 'priya-nair', 'amara-okafor', 'theo-park'],
    currentSpan: { from: 21, to: 30 },
  },
  {
    id: 'br-evelyn-hugo',
    bookId: 'the-seven-husbands-of-evelyn-hugo',
    hostId: 'jordan-ruiz',
    participantIds: ['jordan-ruiz', 'priya-nair', 'sam-whitfield', 'leo-martins'],
    currentSpan: { from: 1, to: 10 },
  },
]

/** Sofía is in the Fourth Wing buddy read */
export const JOINED_BUDDY_READS_SEED = ['br-fourth-wing']

export function getBuddyRead(id: string): BuddyRead | undefined {
  return buddyReads.find((b) => b.id === id)
}

// Comments stay vague on purpose: written for the prototype, no real plot details quoted
export const buddyComments: BuddyComment[] = [
  { id: 'bc01', buddyReadId: 'br-fourth-wing', chapter: 3, authorId: 'maya-chen', text: 'That opening crossing had me holding my breath. What a way to start.', createdAt: '2026-10-03T20:10:00', containsSpoilers: false, likes: 4 },
  { id: 'bc02', buddyReadId: 'br-fourth-wing', chapter: 8, authorId: 'lucia-gomez', text: "The squad dynamics are already so good. I'd read a whole book just about their dinners.", createdAt: '2026-10-05T19:40:00', containsSpoilers: false, likes: 2 },
  { id: 'bc03', buddyReadId: 'br-fourth-wing', chapter: 15, authorId: 'theo-park', text: 'Okay the training chapters are pure adrenaline. Anyone else reading these way too fast?', createdAt: '2026-10-09T22:05:00', containsSpoilers: false, likes: 3 },
  { id: 'bc04', buddyReadId: 'br-fourth-wing', chapter: 22, authorId: 'maya-chen', text: "This is the chapter where I stopped pretending I'd go to bed early.", createdAt: '2026-10-16T07:45:00', containsSpoilers: false, likes: 5 },
  { id: 'bc05', buddyReadId: 'br-fourth-wing', chapter: 24, authorId: 'priya-nair', text: 'The tension in this one. I had to put the book down and walk around my apartment.', createdAt: '2026-10-15T18:30:00', containsSpoilers: false, likes: 2 },
  { id: 'bc06', buddyReadId: 'br-fourth-wing', chapter: 24, authorId: 'amara-okafor', text: 'I have a theory about who knows more than they are letting on. Saving it for the end.', createdAt: '2026-10-15T21:00:00', containsSpoilers: false, likes: 1 },
  { id: 'bc07', buddyReadId: 'br-fourth-wing', chapter: 27, authorId: 'lucia-gomez', text: 'Nobody warned me about this chapter. I need everyone to catch up immediately.', createdAt: '2026-10-15T21:30:00', containsSpoilers: false, likes: 2 },
  { id: 'bc08', buddyReadId: 'br-fourth-wing', chapter: 31, authorId: 'maya-chen', text: "Called it! The thing I suspected back in chapter 12 was right, and I'm still not okay.", createdAt: '2026-10-16T06:50:00', containsSpoilers: true, likes: 1 },

  { id: 'bc09', buddyReadId: 'br-evelyn-hugo', chapter: 2, authorId: 'jordan-ruiz', text: 'Love a framing device. Who else is already suspicious of the interview setup?', createdAt: '2026-10-07T20:00:00', containsSpoilers: false, likes: 2 },
  { id: 'bc10', buddyReadId: 'br-evelyn-hugo', chapter: 5, authorId: 'sam-whitfield', text: 'The audiobook full cast is doing a lot for me here.', createdAt: '2026-10-10T08:15:00', containsSpoilers: false, likes: 1 },
  { id: 'bc11', buddyReadId: 'br-evelyn-hugo', chapter: 8, authorId: 'priya-nair', text: 'First husband down, six to go. The pacing of these sections is so smart.', createdAt: '2026-10-16T08:05:00', containsSpoilers: false, likes: 3 },
  { id: 'bc12', buddyReadId: 'br-evelyn-hugo', chapter: 8, authorId: 'leo-martins', text: 'Not my usual genre but I get the hype now.', createdAt: '2026-10-16T08:30:00', containsSpoilers: false, likes: 0 },
]

/* ---------- Groups ---------- */

export const groups: Group[] = [
  {
    id: 'romantasy-girlies',
    name: 'Romantasy Girlies',
    description: 'Dragons, fae courts and slow burns. Spoilers go in tagged threads only.',
    memberCount: 1248,
  },
  {
    id: 'thriller-thursdays',
    name: 'Thriller Thursdays',
    description: 'One twisty read a week, discussed every Thursday. No ending spoilers outside the spoiler threads.',
    memberCount: 642,
  },
  {
    id: 'bogota-book-club',
    name: 'Bogotá Book Club',
    description: 'Readers in and around Bogotá. Monthly meetups, book swaps and café recs.',
    memberCount: 87,
  },
]

export const JOINED_GROUPS_SEED = ['romantasy-girlies', 'bogota-book-club']

export function getGroup(id: string): Group | undefined {
  return groups.find((g) => g.id === id)
}

export const groupThreads: GroupThread[] = [
  { id: 't-rg-1', groupId: 'romantasy-girlies', title: "Who's your favorite dragon so far?", authorId: 'maya-chen', body: 'No spoilers past book one please. I will start: the grumpy ones, always.', createdAt: '2026-10-11T19:00:00', likes: 34 },
  { id: 't-rg-2', groupId: 'romantasy-girlies', title: 'Slow burn recs that actually pay off', authorId: 'lucia-gomez', body: 'I need a slow burn where the payoff is worth the 400 pages of yearning. Go.', createdAt: '2026-10-13T10:20:00', likes: 21 },
  { id: 't-rg-3', groupId: 'romantasy-girlies', title: 'Onyx Storm reread schedule', authorId: 'priya-nair', body: 'Thinking two chapters a day starting November. Who is in?', createdAt: '2026-10-15T17:45:00', likes: 12 },
  { id: 't-rg-4', groupId: 'romantasy-girlies', title: 'Book boyfriend tier list (be nice)', authorId: 'amara-okafor', body: 'S tier only has two names and I will not be taking questions.', createdAt: '2026-10-08T21:10:00', likes: 57 },

  { id: 't-tt-1', groupId: 'thriller-thursdays', title: 'The Silent Patient: did you guess it?', authorId: 'jordan-ruiz', body: 'Be honest. Spoiler-free answers only: yes, no, or "I had a feeling".', createdAt: '2026-10-09T20:00:00', likes: 18 },
  { id: 't-tt-2', groupId: 'thriller-thursdays', title: 'Best unreliable narrator?', authorId: 'sam-whitfield', body: 'Looking for the narrator who lied to you the most convincingly.', createdAt: '2026-10-12T12:00:00', likes: 9 },
  { id: 't-tt-3', groupId: 'thriller-thursdays', title: 'October pick: The Housemaid', authorId: 'leo-martins', body: 'Discussion goes live Thursday. Drop your first impressions here.', createdAt: '2026-10-14T09:30:00', likes: 6 },

  { id: 't-bb-1', groupId: 'bogota-book-club', title: 'November meetup: café near Parque 93?', authorId: 'lucia-gomez', body: 'Thinking Saturday the 7th in the afternoon. Bring a book to swap.', createdAt: '2026-10-14T15:00:00', likes: 8 },
  { id: 't-bb-2', groupId: 'bogota-book-club', title: 'Book swap: anyone have Iron Flame?', authorId: ME, body: "I can trade a very loved copy of The Martian. I'm almost done with Fourth Wing and I need book two.", createdAt: '2026-10-15T12:10:00', likes: 4 },
  { id: 't-bb-3', groupId: 'bogota-book-club', title: 'Reading in Spanish or English?', authorId: 'amara-okafor', body: 'Curious how everyone picks. Translations, originals, or whatever the library has?', createdAt: '2026-10-06T18:40:00', likes: 11 },
]

export const groupReplies: GroupReply[] = [
  { id: 'r01', threadId: 't-rg-1', authorId: 'priya-nair', text: 'The one who judges everyone silently. Iconic behavior.', createdAt: '2026-10-11T19:30:00', likes: 9 },
  { id: 'r02', threadId: 't-rg-1', authorId: ME, text: 'Grumpy dragons supremacy. They are all secretly soft.', createdAt: '2026-10-11T21:00:00', likes: 6 },
  { id: 'r03', threadId: 't-rg-1', authorId: 'maya-chen', text: '@sofiareads exactly this. The soft ones never stood a chance.', createdAt: '2026-10-12T08:15:00', likes: 4 },
  { id: 'r04', threadId: 't-rg-1', authorId: 'amara-okafor', text: 'Anyone who protects their rider no questions asked.', createdAt: '2026-10-12T10:00:00', likes: 3 },

  { id: 'r05', threadId: 't-rg-2', authorId: 'amara-okafor', text: 'The Cruel Prince trilogy. Trust the process.', createdAt: '2026-10-13T11:00:00', likes: 7 },
  { id: 'r06', threadId: 't-rg-2', authorId: 'maya-chen', text: 'A Court of Mist and Fury, if you survive the first book.', createdAt: '2026-10-13T12:40:00', likes: 5 },
  { id: 'r07', threadId: 't-rg-2', authorId: 'priya-nair', text: 'From Blood and Ash. The yearning is industrial-strength.', createdAt: '2026-10-13T14:05:00', likes: 2 },

  { id: 'r08', threadId: 't-rg-3', authorId: 'maya-chen', text: "In. I'll bring snacks and emotional support.", createdAt: '2026-10-15T18:00:00', likes: 3 },
  { id: 'r09', threadId: 't-rg-3', authorId: 'lucia-gomez', text: 'Two a day is ambitious but I believe in us.', createdAt: '2026-10-15T19:20:00', likes: 1 },

  { id: 'r10', threadId: 't-rg-4', authorId: 'lucia-gomez', text: 'Bold of you to post this in public.', createdAt: '2026-10-08T21:30:00', likes: 10 },
  { id: 'r11', threadId: 't-rg-4', authorId: 'priya-nair', text: 'I need to see the C tier before I can respond calmly.', createdAt: '2026-10-08T22:00:00', likes: 8 },
  { id: 'r12', threadId: 't-rg-4', authorId: 'maya-chen', text: 'Respectfully, see you in the comments.', createdAt: '2026-10-09T07:45:00', likes: 4 },
  { id: 'r13', threadId: 't-rg-4', authorId: 'theo-park', text: 'Just here to watch.', createdAt: '2026-10-09T09:10:00', likes: 6 },
  { id: 'r14', threadId: 't-rg-4', authorId: 'amara-okafor', text: 'The list stands. No notes.', createdAt: '2026-10-09T10:00:00', likes: 12 },

  { id: 'r15', threadId: 't-tt-1', authorId: 'sam-whitfield', text: 'I had a feeling. Then I doubted myself. Then I was right.', createdAt: '2026-10-09T20:30:00', likes: 4 },
  { id: 'r16', threadId: 't-tt-1', authorId: 'leo-martins', text: 'Not even close. Respect.', createdAt: '2026-10-09T21:00:00', likes: 2 },
  { id: 'r17', threadId: 't-tt-1', authorId: 'priya-nair', text: 'Yes, but only because someone hinted at it in a group chat.', createdAt: '2026-10-10T08:00:00', likes: 5 },
  { id: 'r18', threadId: 't-tt-1', authorId: 'jordan-ruiz', text: 'Group chats are a spoiler minefield. Mute them.', createdAt: '2026-10-10T09:15:00', likes: 3 },

  { id: 'r19', threadId: 't-tt-2', authorId: 'jordan-ruiz', text: 'Gone Girl, and it is not a contest.', createdAt: '2026-10-12T12:30:00', likes: 6 },
  { id: 'r20', threadId: 't-tt-2', authorId: 'amara-okafor', text: 'Verity made me distrust my own reading comprehension.', createdAt: '2026-10-12T13:10:00', likes: 4 },
  { id: 'r21', threadId: 't-tt-2', authorId: 'leo-martins', text: 'The Girl on the Train had me second-guessing every chapter.', createdAt: '2026-10-12T15:45:00', likes: 1 },

  { id: 'r22', threadId: 't-tt-3', authorId: 'sam-whitfield', text: 'Fifty pages in and I already do not trust anyone in that house.', createdAt: '2026-10-14T10:00:00', likes: 2 },
  { id: 'r23', threadId: 't-tt-3', authorId: 'jordan-ruiz', text: 'Reading it in one sitting this weekend.', createdAt: '2026-10-14T18:20:00', likes: 1 },

  { id: 'r24', threadId: 't-bb-1', authorId: 'amara-okafor', text: 'Visiting that week. Count me in if it is a Saturday.', createdAt: '2026-10-14T16:00:00', likes: 2 },
  { id: 'r25', threadId: 't-bb-1', authorId: ME, text: "I'm in. I'll bring a couple of thrillers to swap.", createdAt: '2026-10-14T18:30:00', likes: 3 },
  { id: 'r26', threadId: 't-bb-1', authorId: 'theo-park', text: 'Joining on video from Seoul, someone hold the phone up.', createdAt: '2026-10-15T09:00:00', likes: 5 },

  { id: 'r27', threadId: 't-bb-2', authorId: 'theo-park', text: 'Not me, but good luck. Book two is a ride.', createdAt: '2026-10-15T13:00:00', likes: 1 },
  { id: 'r28', threadId: 't-bb-2', authorId: 'lucia-gomez', text: 'I have it! Bring The Martian to the meetup and it is yours.', createdAt: '2026-10-16T08:20:00', likes: 2 },

  { id: 'r29', threadId: 't-bb-3', authorId: 'lucia-gomez', text: 'Originals when I can, Spanish when the library has it first.', createdAt: '2026-10-06T19:00:00', likes: 3 },
  { id: 'r30', threadId: 't-bb-3', authorId: 'jordan-ruiz', text: 'Translations for poetry, originals for everything else.', createdAt: '2026-10-07T08:30:00', likes: 2 },
]

export function getThread(id: string): GroupThread | undefined {
  return groupThreads.find((t) => t.id === id)
}

/* ---------- Messages ---------- */

export const conversations: Conversation[] = [
  {
    id: 'c-maya',
    userId: 'maya-chen',
    unread: true,
    messages: [
      { id: 'm01', conversationId: 'c-maya', fromId: ME, text: 'Where are you in Fourth Wing? I just passed page 300.', sentAt: '2026-10-15T20:02:00' },
      { id: 'm02', conversationId: 'c-maya', fromId: 'maya-chen', text: 'A bit ahead of you. Do NOT stop now.', sentAt: '2026-10-15T20:10:00' },
      { id: 'm03', conversationId: 'c-maya', fromId: ME, text: 'That is extremely suspicious.', sentAt: '2026-10-15T20:11:00' },
      { id: 'm04', conversationId: 'c-maya', fromId: 'maya-chen', text: 'Just keep reading. And check the buddy read later, I posted a new comment.', sentAt: '2026-10-16T07:48:00' },
    ],
  },
  {
    id: 'c-lucia',
    userId: 'lucia-gomez',
    unread: true,
    messages: [
      { id: 'm05', conversationId: 'c-lucia', fromId: 'lucia-gomez', text: 'How is The Cruel Prince treating you?', sentAt: '2026-10-13T18:00:00' },
      { id: 'm06', conversationId: 'c-lucia', fromId: ME, text: "Chapter by chapter I like everyone less and the book more.", sentAt: '2026-10-13T18:20:00' },
      { id: 'm07', conversationId: 'c-lucia', fromId: 'lucia-gomez', text: 'Correct reaction. Keep my copy as long as you need.', sentAt: '2026-10-13T18:22:00' },
      { id: 'm08', conversationId: 'c-lucia', fromId: 'lucia-gomez', text: 'Also, this is next once you finish:', sentAt: '2026-10-16T08:25:00' },
      { id: 'm09', conversationId: 'c-lucia', fromId: 'lucia-gomez', text: '', bookId: 'a-court-of-thorns-and-roses', sentAt: '2026-10-16T08:25:30' },
    ],
  },
  {
    id: 'c-jordan',
    userId: 'jordan-ruiz',
    unread: false,
    messages: [
      { id: 'm10', conversationId: 'c-jordan', fromId: 'jordan-ruiz', text: 'Finished Babel. We need to talk when you get to it.', sentAt: '2026-10-11T22:15:00' },
      { id: 'm11', conversationId: 'c-jordan', fromId: ME, text: 'It is on my list! Moving it up.', sentAt: '2026-10-11T22:40:00' },
      { id: 'm12', conversationId: 'c-jordan', fromId: 'jordan-ruiz', text: 'Good. No spoilers from me, promise.', sentAt: '2026-10-12T09:05:00' },
    ],
  },
]

export function getConversation(id: string): Conversation | undefined {
  return conversations.find((c) => c.id === id)
}

/* ---------- Notifications ---------- */

export const notifications: AppNotification[] = [
  {
    id: 'n1',
    type: 'reply',
    actorId: 'lucia-gomez',
    text: 'Lucía Gómez replied to your thread "Book swap: anyone have Iron Flame?"',
    href: '/community/groups/bogota-book-club/threads/t-bb-2#reply',
    createdAt: '2026-10-16T08:20:00',
    read: false,
  },
  {
    id: 'n2',
    type: 'buddy_comments',
    actorId: 'maya-chen',
    bookId: 'fourth-wing',
    text: '3 new comments in the Fourth Wing buddy read',
    href: '/community/buddy/br-fourth-wing',
    createdAt: '2026-10-16T07:50:00',
    read: false,
  },
  {
    id: 'n3',
    type: 'review_like',
    actorId: 'maya-chen',
    bookId: 'the-song-of-achilles',
    text: 'Maya Chen and 11 others liked your review of The Song of Achilles',
    href: '/profile',
    createdAt: '2026-10-15T22:10:00',
    read: false,
  },
  {
    id: 'n4',
    type: 'reply',
    actorId: 'maya-chen',
    text: 'Maya Chen replied to you in "Who\'s your favorite dragon so far?"',
    href: '/community/groups/romantasy-girlies/threads/t-rg-1#reply',
    createdAt: '2026-10-12T08:15:00',
    read: true,
  },
  {
    id: 'n5',
    type: 'friend_finished',
    actorId: 'jordan-ruiz',
    bookId: 'babel',
    text: 'Jordan Ruiz finished Babel, which is on your Want to read',
    href: '/book/babel',
    createdAt: '2026-10-11T22:05:00',
    read: true,
  },
  {
    // Mock: release timing is made up for the prototype
    id: 'n6',
    type: 'new_release',
    bookId: 'funny-story',
    text: 'New from Emily Henry, an author you read: Funny Story',
    href: '/book/funny-story',
    createdAt: '2026-10-09T09:00:00',
    read: true,
  },
  {
    id: 'n7',
    type: 'review_like',
    actorId: 'theo-park',
    bookId: 'project-hail-mary',
    text: 'Theo Park liked your review of Project Hail Mary',
    href: '/profile',
    createdAt: '2026-10-08T17:30:00',
    read: true,
  },
  {
    id: 'n8',
    type: 'buddy_comments',
    actorId: 'jordan-ruiz',
    bookId: 'the-seven-husbands-of-evelyn-hugo',
    text: '2 new comments in The Seven Husbands of Evelyn Hugo buddy read',
    href: '/community/buddy/br-evelyn-hugo',
    createdAt: '2026-10-10T08:20:00',
    read: true,
  },
]
