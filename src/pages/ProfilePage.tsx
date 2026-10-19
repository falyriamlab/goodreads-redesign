import { useState } from 'react'
import { Settings } from 'lucide-react'
import { Navigate, useNavigate, useParams } from 'react-router'
import { TopBar, TopBarIconButton } from '@/components/layout/TopBar'
import { FavoritePickerDrawer } from '@/components/profile/FavoritePickerDrawer'
import { ProfileView, type ProfileViewData } from '@/components/profile/ProfileView'
import { detailNote } from '@/lib/challenge'
import { monthStats, yearStats } from '@/lib/stats'
import { books, getBookById } from '@/mocks/books'
import { getReaderByHandle, groups } from '@/mocks/community'
import type { FriendActivity } from '@/mocks/friends'
import { reviews as communityReviews } from '@/mocks/reviews'
import { useChallengeProgress, useLibrary } from '@/state/library'
import type { LibraryEntry } from '@/types/library'

// Mock social counts for Sofía; "following" adds the readers she follows in the app
const SOFIA_FOLLOWERS = 128
const SOFIA_OTHER_FOLLOWING = 92

export function ProfilePage() {
  const navigate = useNavigate()
  const profile = useLibrary((s) => s.profile)
  const entries = useLibrary((s) => s.entries)
  const history = useLibrary((s) => s.history)
  const shelves = useLibrary((s) => s.shelves)
  const addFavorite = useLibrary((s) => s.addFavorite)
  const following = useLibrary((s) => s.following)
  const joinedGroups = useLibrary((s) => s.joinedGroups)
  const [pickerOpen, setPickerOpen] = useState(false)

  const challenge = useChallengeProgress()
  const stats = yearStats(history, challenge.year)
  const [now] = useState(() => new Date())
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const monthName = now.toLocaleDateString('en-US', { month: 'long' })
  const hasMonthFinishes = monthStats(history, month).books > 0

  const data: ProfileViewData = {
    isOwner: true,
    name: profile.displayName,
    handle: profile.handle,
    city: profile.city,
    bio: profile.bio,
    counts: { read: challenge.read, followers: SOFIA_FOLLOWERS, following: SOFIA_OTHER_FOLLOWING + following.length },
    favorites: profile.favorites.filter((id) => getBookById(id)),
    currentlyReading: books.filter((b) => entries[b.id]?.status === 'reading').map((b) => b.id),
    publicSections: profile.publicSections,
    reviews: ownReviews(entries, profile.displayName),
    lists: shelves,
    groups: groups.filter((g) => joinedGroups.includes(g.id)),
    journal: [...history]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5)
      .map((event) => ({ event, loved: entries[event.bookId]?.loved ?? false })),
    stats: {
      year: challenge.year,
      challenge: { read: challenge.read, goal: challenge.goal },
      pages: stats.pages,
      avgRating: stats.avgRating,
      topGenres: stats.topGenres,
      vibe: stats.topMoods.map((m) => m.label),
      note: detailNote(stats.books, challenge.countOnly),
      monthRecap: hasMonthFinishes ? { monthName, href: `/share?type=month&month=${month}` } : null,
    },
  }

  return (
    <>
      <TopBar
        actions={<TopBarIconButton label="Settings" icon={<Settings aria-hidden="true" />} onClick={() => navigate('/settings')} />}
      />
      <ProfileView data={data} onAddFavorite={() => setPickerOpen(true)} />
      <FavoritePickerDrawer open={pickerOpen} onOpenChange={setPickerOpen} exclude={profile.favorites} onPick={addFavorite} />
    </>
  )
}

/** Sofía's reviews come from her own log entries */
function ownReviews(entries: Record<string, LibraryEntry>, name: string) {
  return books
    .filter((b) => entries[b.id]?.reviewText)
    .map((b) => {
      const e = entries[b.id]
      return {
        id: `own-${b.id}`,
        bookId: b.id,
        author: { name, avatarUrl: null, isFriend: false },
        rating: e.rating,
        loved: e.loved,
        text: e.reviewText as string,
        containsSpoilers: e.containsSpoilers,
        verifiedRead: e.status === 'read' || e.status === 'dnf',
        likes: 0,
        replies: 0,
        postedAt: e.finishedAt ?? e.addedAt ?? '2026-01-01',
      }
    })
    .sort((a, b) => b.postedAt.localeCompare(a.postedAt))
}

/** /u/:handle: a friend's profile as a visitor */
export function VisitorProfilePage() {
  const { handle = '' } = useParams()
  const ownHandle = useLibrary((s) => s.profile.handle)
  const entries = useLibrary((s) => s.entries)
  const friend = getReaderByHandle(handle)

  if (handle === ownHandle) return <Navigate to="/profile" replace />
  if (!friend) {
    return (
      <>
        <TopBar title="Profile not found" back />
        <p className="px-4 py-6 text-sm text-muted-foreground">We couldn't find @{handle}.</p>
      </>
    )
  }
  return <FriendProfile key={friend.id} friend={friend} myEntries={entries} />
}

function FriendProfile({ friend, myEntries }: { friend: FriendActivity; myEntries: Record<string, LibraryEntry> }) {
  const following = useLibrary((s) => s.following.includes(friend.id))
  const follow = useLibrary((s) => s.follow)
  const unfollow = useLibrary((s) => s.unfollow)
  const sharedLovedId = friend.loved.find((id) => myEntries[id]?.loved)

  // Their vibe: most common moods across their favorites
  const moodCounts = new Map<string, number>()
  for (const id of friend.favorites) for (const m of getBookById(id)?.moods ?? []) moodCounts.set(m, (moodCounts.get(m) ?? 0) + 1)
  const vibe = [...moodCounts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 3).map(([m]) => m)

  const data: ProfileViewData = {
    isOwner: false,
    name: friend.name,
    handle: friend.handle,
    city: friend.city,
    bio: friend.bio,
    counts: { read: friend.readThisYear, followers: friend.followers + (following ? 1 : 0), following: friend.following },
    favorites: friend.favorites,
    currentlyReading: friend.status === 'reading' ? [friend.bookId] : [],
    publicSections: friend.publicSections,
    reviews: communityReviews.filter((r) => r.author.name === friend.name),
    lists: friend.lists,
    journal: friend.recentlyFinished.map((f, i) => ({
      event: { id: `${friend.id}-${i}`, bookId: f.bookId, type: 'finished' as const, date: f.date, rating: f.rating, isReread: false },
      loved: friend.loved.includes(f.bookId),
    })),
    stats: { year: 2026, challenge: null, pages: null, avgRating: null, topGenres: [], vibe },
    sharedLoved: sharedLovedId ? getBookById(sharedLovedId) : null,
  }

  return (
    <>
      <TopBar back />
      <ProfileView data={data} following={following} onToggleFollow={() => (following ? unfollow(friend.id) : follow(friend.id))} />
    </>
  )
}
