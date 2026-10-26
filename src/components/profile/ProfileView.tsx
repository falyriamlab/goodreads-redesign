import { useId, useState, type ReactNode } from 'react'
import { Heart, Lock, Pencil, Plus, Share2 } from 'lucide-react'
import { Link } from 'react-router'
import { BookCover } from '@/components/book/BookCover'
import { ReviewCard } from '@/components/book/ReviewCard'
import { JournalEntry } from '@/components/journal/JournalEntry'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatRating } from '@/lib/rating'
import { initials } from '@/lib/initials'
import type { Share } from '@/lib/stats'
import { cn } from '@/lib/utils'
import { getBookById } from '@/mocks/books'
import type { Book } from '@/types/book'
import type { ReadingEvent } from '@/types/library'
import type { ProfileSection } from '@/types/profile'
import type { Review } from '@/types/review'

export type ProfileViewData = {
  isOwner: boolean
  name: string
  handle: string
  city: string
  bio: string
  counts: { read: number; followers: number; following: number }
  favorites: string[]
  currentlyReading: string[]
  publicSections: Record<ProfileSection, boolean>
  reviews: Review[]
  lists: { id: string; name: string; bookIds: string[] }[]
  /** Owner: groups you've joined */
  groups?: { id: string; name: string; memberCount: number }[]
  journal: { event: ReadingEvent; loved: boolean }[]
  /** null = nothing to show */
  stats: {
    year: number
    challenge: { read: number; goal: number } | null
    pages: number | null
    avgRating: number | null
    topGenres: Share[]
    vibe: string[]
    /** Owner: "Based on 12 books with full details · 26 imported as count only." */
    note?: string
    /** Owner: shown when this month has finished books */
    monthRecap?: { monthName: string; href: string } | null
  } | null
  /** Visitor mode: a loved book in common */
  sharedLoved?: Book | null
}

type Props = {
  data: ProfileViewData
  /** Owner: the challenge on the brand band (rule 2), shown under the Top 4 */
  challengeBand?: ReactNode
  /** Owner only: open the favorite picker */
  onAddFavorite?: () => void
  /** Visitor only */
  following?: boolean
  onToggleFollow?: () => void
}

const linkClass =
  'inline-flex min-h-11 min-w-11 items-center text-sm font-semibold underline underline-offset-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/50'

const book = (id: string) => getBookById(id) as Book

export function ProfileView({ data, challengeBand, onAddFavorite, following, onToggleFollow }: Props) {
  // Owners see every section (private ones are labelled); visitors only see public ones
  const visible = (s: ProfileSection) => data.isOwner || data.publicSections[s]
  const isPrivate = (s: ProfileSection) => data.isOwner && !data.publicSections[s]

  return (
    <div className="space-y-10 pb-10">
      <Header data={data} following={following} onToggleFollow={onToggleFollow} />
      <TopFour data={data} onAddFavorite={onAddFavorite} />
      {challengeBand}
      {data.stats && visible('stats') && <YearSoFar data={data} privateLabel={isPrivate('stats')} />}
      {data.currentlyReading.length > 0 && (
        <Section title="Currently reading">
          <ul className="flex gap-3 relative overflow-x-auto px-4 pb-1">
            {data.currentlyReading.map((id) => (
              <li key={id} className="shrink-0">
                <Link to={`/book/${id}`} className="block rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
                  <BookCover book={book(id)} size="md" />
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}
      <ProfileTabs data={data} visible={visible} isPrivate={isPrivate} />
    </div>
  )
}

function Section({ title, action, children, privateLabel }: { title: string; action?: ReactNode; children: ReactNode; privateLabel?: boolean }) {
  const id = useId()
  return (
    <section aria-labelledby={id} className="space-y-4">
      <div className="flex items-center justify-between gap-3 px-4">
        <h2 id={id} className="flex items-center gap-2 section-title">
          {title}
          {privateLabel && <PrivateBadge />}
        </h2>
        {action}
      </div>
      {children}
    </section>
  )
}

function PrivateBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-muted-foreground px-2 py-0.5 text-xs font-medium">
      <Lock className="size-3" aria-hidden="true" />
      Only you
    </span>
  )
}

/* ---------- Header ---------- */

function Header({ data, following, onToggleFollow }: Pick<Props, 'following' | 'onToggleFollow'> & { data: ProfileViewData }) {
  return (
    // Rule 1: the profile header is this screen's one paper band (its hero moment)
    <div className="space-y-4 bg-band px-4 pt-6 pb-6 text-band-foreground">
      <div className="flex items-start gap-4">
        <div
          aria-hidden="true"
          className="flex size-18 shrink-0 items-center justify-center rounded-full bg-secondary text-2xl font-bold text-secondary-foreground"
        >
          {initials(data.name)}
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <h1 className="font-serif text-3xl leading-tight font-semibold tracking-tight">{data.name}</h1>
          <p className="text-sm text-band-muted-foreground">
            @{data.handle}
            {data.city && ` · ${data.city}`}
          </p>
        </div>
      </div>
      {data.bio && <p className="text-sm">{data.bio}</p>}
      {data.sharedLoved && (
        <p className="flex items-center gap-1.5 text-sm font-medium">
          <Heart className="size-4 fill-current" aria-hidden="true" />
          You both loved {data.sharedLoved.title}
        </p>
      )}
      <dl className="flex gap-5 text-sm">
        {(
          [
            ['read', data.counts.read],
            ['followers', data.counts.followers],
            ['following', data.counts.following],
          ] as const
        ).map(([label, n]) => (
          <div key={label} className="flex items-baseline gap-1">
            <dt className="sr-only">{label}</dt>
            <dd className="font-bold tabular-nums">{n.toLocaleString('en-US')}</dd>
            <span aria-hidden="true" className="text-band-muted-foreground">
              {label}
            </span>
          </div>
        ))}
      </dl>
      <div className="flex gap-2">
        {data.isOwner ? (
          <>
            <Button asChild variant="outline" className="min-h-11 flex-1 border-muted-foreground">
              <Link to="/profile/edit">
                <Pencil aria-hidden="true" />
                Edit profile
              </Link>
            </Button>
            <Button asChild variant="outline" size="icon" className="size-11 border-muted-foreground [&_svg]:size-5">
              <Link to="/share?type=top4" aria-label="Share profile">
                <Share2 aria-hidden="true" />
              </Link>
            </Button>
          </>
        ) : (
          <Button
            // Toggle: the name stays "Follow {name}", aria-pressed carries the state
            aria-pressed={following}
            aria-label={`Follow ${data.name}`}
            variant={following ? 'outline' : 'default'}
            className={cn('min-h-11 flex-1', following && 'border-foreground font-semibold')}
            onClick={onToggleFollow}
          >
            <span aria-hidden="true">{following ? 'Following' : 'Follow'}</span>
          </Button>
        )}
      </div>
    </div>
  )
}

/* ---------- Top 4 ---------- */

function TopFour({ data, onAddFavorite }: { data: ProfileViewData; onAddFavorite?: () => void }) {
  const empty = data.isOwner ? 4 - data.favorites.length : 0
  if (data.favorites.length === 0 && !data.isOwner) return null
  return (
    <Section title={data.isOwner ? 'My top 4' : 'Top 4'}>
      <ul className="grid grid-cols-4 gap-3 px-4">
        {data.favorites.map((id) => (
          <li key={id}>
            <Link to={`/book/${id}`} className="block rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
              <BookCover book={book(id)} className="w-full" />
            </Link>
          </li>
        ))}
        {Array.from({ length: empty }, (_, i) => (
          <li key={`empty-${i}`}>
            <button
              type="button"
              onClick={onAddFavorite}
              className="flex aspect-2/3 w-full flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed border-muted-foreground p-1 text-center text-xs font-medium outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <Plus className="size-5" aria-hidden="true" />
              Add a favorite
            </button>
          </li>
        ))}
      </ul>
    </Section>
  )
}

/* ---------- Year so far ---------- */

function YearSoFar({ data, privateLabel }: { data: ProfileViewData; privateLabel: boolean }) {
  const s = data.stats!
  return (
    <Section
      title={data.isOwner ? `Your ${s.year} so far` : `${data.name.split(' ')[0]}'s ${s.year}`}
      privateLabel={privateLabel}
    >
      <div className="mx-4 space-y-4 rounded-xl border border-border bg-card p-4 text-card-foreground">
        <dl className="grid grid-cols-3 gap-2">
          {/* The owner's challenge is on the brand band above; visitors see the count here */}
          {!data.isOwner && <BigStat label="Books read" value={String(data.counts.read)} />}
          {s.pages !== null && <BigStat label="Pages" value={s.pages.toLocaleString('en-US')} />}
          {s.avgRating !== null && <BigStat label="Avg rating" value={formatRating(s.avgRating)} suffix="stars" />}
        </dl>

        {s.topGenres.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-semibold">Top genres</p>
            <ul className="space-y-2">
              {s.topGenres.map((g) => (
                <li key={g.label} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{g.label}</span>
                    {/* The number is always written: the bar is never the only carrier */}
                    <span className="font-semibold tabular-nums">{g.percent}%</span>
                  </div>
                  <div aria-hidden="true" className="h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${g.percent}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {s.vibe.length > 0 && (
          <p className="text-sm">
            <span className="text-muted-foreground">{data.isOwner ? 'Your' : 'Their'} vibe this year:</span>{' '}
            <span className="font-semibold">{s.vibe.join(' · ')}</span>
          </p>
        )}

        {s.note && <p className="text-xs text-muted-foreground">{s.note}</p>}

        {s.monthRecap && (
          <Link to={s.monthRecap.href} className={cn(linkClass, 'gap-2')}>
            <Share2 className="size-4" aria-hidden="true" />
            Share your {s.monthRecap.monthName} recap
          </Link>
        )}

        {data.isOwner && (
          <div className="flex gap-4">
            <Link to="/profile/stats" className={linkClass}>
              See all stats
            </Link>
            <Link to="/share?type=year" className={linkClass}>
              Share<span className="sr-only"> your {s.year} recap</span>
            </Link>
          </div>
        )}
      </div>
    </Section>
  )
}

function BigStat({ label, value, suffix }: { label: string; value: string; suffix?: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd>
        <span className="font-serif text-3xl leading-none font-semibold tabular-nums">{value}</span>
        {suffix && <span className="ml-1 text-xs text-muted-foreground">{suffix}</span>}
      </dd>
    </div>
  )
}

/* ---------- Tabs ---------- */

const SECTION_TABS: { value: ProfileSection | 'groups'; label: string }[] = [
  { value: 'reviews', label: 'Reviews' },
  { value: 'lists', label: 'Lists' },
  { value: 'journal', label: 'Journal' },
  { value: 'groups', label: 'Groups' },
]

function ProfileTabs({
  data,
  visible,
  isPrivate,
}: {
  data: ProfileViewData
  visible: (s: ProfileSection) => boolean
  isPrivate: (s: ProfileSection) => boolean
}) {
  const tabs = SECTION_TABS.filter((t) => t.value === 'groups' || visible(t.value))
  const [tab, setTab] = useState(tabs[0].value)

  return (
    <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="gap-0">
      <TabsList variant="line" aria-label="Profile sections" className="h-auto w-full justify-start gap-0 relative overflow-x-auto border-b border-border px-2">
        {tabs.map((t) => (
          <TabsTrigger
            key={t.value}
            value={t.value}
            className="min-h-11 min-w-11 flex-none gap-1 px-3 text-muted-foreground data-active:font-semibold data-active:text-foreground"
          >
            {t.label}
            {t.value !== 'groups' && isPrivate(t.value) && (
              <>
                <Lock className="size-3" aria-hidden="true" />
                <span className="sr-only"> (only you)</span>
              </>
            )}
          </TabsTrigger>
        ))}
      </TabsList>

      <div className="px-4 pt-4">
        <TabsContent value="reviews" className="space-y-4">
          {data.reviews.length === 0 ? (
            <p className="text-sm text-muted-foreground">No reviews yet.</p>
          ) : (
            data.reviews.map((r) => (
              <div key={r.id} className="space-y-2">
                <Link
                  to={`/book/${r.bookId}`}
                  className="flex min-h-11 items-center gap-2 text-sm font-semibold outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <BookCover book={book(r.bookId)} size="sm" className="w-8" />
                  {book(r.bookId).title}
                </Link>
                <ReviewCard review={r} />
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="lists">
          {data.lists.length === 0 ? (
            <p className="text-sm text-muted-foreground">No lists yet.</p>
          ) : (
            <ul className="grid grid-cols-2 gap-3">
              {data.lists.map((list) => (
                <li key={list.id} className="space-y-2 rounded-xl border border-border bg-card p-3 text-card-foreground">
                  {/* Three covers fanned out */}
                  <div aria-hidden="true" className="flex h-24 items-end pl-1">
                    {list.bookIds.slice(0, 3).map((id, i) => (
                      <BookCover key={id} book={book(id)} size="sm" className={cn('shadow-md', i > 0 && '-ml-6', i === 1 && 'rotate-3', i === 2 && '-rotate-2')} />
                    ))}
                  </div>
                  <p className="text-sm font-semibold">{list.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {list.bookIds.length} {list.bookIds.length === 1 ? 'book' : 'books'}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="journal">
          {data.journal.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing logged yet.</p>
          ) : (
            <>
              <ul className="divide-y divide-border">
                {data.journal.map(({ event, loved }) => (
                  <li key={event.id}>
                    <JournalEntry event={event} book={book(event.bookId)} loved={loved} />
                  </li>
                ))}
              </ul>
              {data.isOwner && (
                <Link to="/library/journal" className={linkClass}>
                  Open journal
                </Link>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="groups">
          {!data.groups?.length ? (
            <p className="text-sm text-muted-foreground">{data.isOwner ? 'No groups yet.' : 'Groups are private.'}</p>
          ) : (
            <ul className="divide-y divide-border">
              {data.groups.map((g) => (
                <li key={g.id}>
                  <Link
                    to={`/community/groups/${g.id}`}
                    className="flex min-h-14 flex-col justify-center outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <span className="text-sm font-semibold">{g.name}</span>
                    <span className="text-xs text-muted-foreground">{(g.memberCount + 1).toLocaleString('en-US')} members</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>
      </div>
    </Tabs>
  )
}
