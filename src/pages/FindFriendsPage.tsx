import { useId, useMemo, useState } from 'react'
import Fuse from 'fuse.js'
import { Contact, Link2, Search } from 'lucide-react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { resolveAuthor } from '@/components/community/people'
import { UserAvatar } from '@/components/community/UserAvatar'
import { TopBar } from '@/components/layout/TopBar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { communityUsers } from '@/mocks/community'
import { useLibrary } from '@/state/library'
import type { CommunityUser } from '@/types/community'

// Name and handle, accents ignored ("lucia" finds Lucía)
const fuse = new Fuse(communityUsers, {
  keys: [
    { name: 'name', weight: 2 },
    { name: 'handle', weight: 1.5 },
  ],
  threshold: 0.35,
  ignoreLocation: true,
  ignoreDiacritics: true,
})

export function FindFriendsPage() {
  const profile = useLibrary((s) => s.profile)
  const following = useLibrary((s) => s.following)
  const follow = useLibrary((s) => s.follow)
  const unfollow = useLibrary((s) => s.unfollow)
  const [query, setQuery] = useState('')
  const searchId = useId()
  const resultsId = useId()
  const inviteId = useId()

  const q = query.trim().replace(/^@/, '')
  const results = useMemo(
    () =>
      q
        ? fuse.search(q).map((r) => r.item)
        : // No query: people you don't follow yet first
          [...communityUsers].sort((a, b) => Number(following.includes(a.id)) - Number(following.includes(b.id))),
    [q, following],
  )
  const inviteUrl = `${window.location.origin}/invite/${profile.handle}`

  async function copyInvite() {
    try {
      await navigator.clipboard.writeText(inviteUrl)
      toast('Link copied.')
    } catch {
      toast("Couldn't copy the link. Select it and copy it manually.")
    }
  }

  return (
    <>
      <TopBar title="Find friends" back backFallback="/community" />
      <div className="space-y-8 px-4 pt-3 pb-8">
        <section aria-labelledby={resultsId} className="space-y-3">
          <div className="relative">
            <label htmlFor={searchId} className="sr-only">
              Search readers by name or @handle
            </label>
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              id={searchId}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or @handle"
              className="min-h-11 border-muted-foreground pl-9 text-base"
            />
          </div>
          <h2 id={resultsId} className="text-lg font-bold tracking-tight">
            {q ? 'Results' : 'Readers you might know'}
          </h2>
          <p role="status" className="sr-only">
            {q ? `${results.length} ${results.length === 1 ? 'reader' : 'readers'} found` : ''}
          </p>
          {results.length === 0 ? (
            <p className="text-sm text-muted-foreground">No readers match "{query}". Check the spelling or try their @handle.</p>
          ) : (
            <ul className="divide-y divide-border">
              {results.map((u) => (
                <ReaderRow
                  key={u.id}
                  user={u}
                  following={following.includes(u.id)}
                  onToggle={() => (following.includes(u.id) ? unfollow(u.id) : follow(u.id))}
                />
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby={inviteId} className="space-y-3 rounded-xl border border-border bg-card p-4 text-card-foreground">
          <h2 id={inviteId} className="text-lg font-bold tracking-tight">
            Invite friends
          </h2>
          <p className="text-sm text-muted-foreground">Reading is better with your people. Send them your link.</p>
          <p className="truncate rounded-md bg-muted px-3 py-2 font-mono text-xs">{inviteUrl}</p>
          <div className="flex flex-col gap-2">
            <Button className="min-h-11" onClick={copyInvite}>
              <Link2 aria-hidden="true" />
              Copy invite link
            </Button>
            {/* Explicit and optional on purpose: no contact upload behind the user's back */}
            <Button variant="outline" className="min-h-11 border-muted-foreground" onClick={() => toast('Coming soon.')}>
              <Contact aria-hidden="true" />
              Connect contacts
            </Button>
            <p className="text-xs text-muted-foreground">We never message your contacts without asking.</p>
          </div>
        </section>
      </div>
    </>
  )
}

function ReaderRow({ user, following, onToggle }: { user: CommunityUser; following: boolean; onToggle: () => void }) {
  const author = resolveAuthor(user.id, '', '')
  return (
    <li className="flex items-center gap-2 py-2">
      {/* Profile link and Follow toggle are siblings, never nested */}
      <Link
        to={`/u/${user.handle}`}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-md py-1 outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <UserAvatar author={author} link={false} />
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold">{user.name}</span>
          <span className="block truncate text-xs text-muted-foreground">@{user.handle}</span>
          <span className="block truncate text-xs">{user.bio}</span>
        </span>
      </Link>
      <Button
        aria-pressed={following}
        aria-label={`Follow ${user.name}`}
        variant={following ? 'outline' : 'default'}
        className={cn('min-h-11 min-w-24 shrink-0', following && 'border-foreground font-semibold')}
        onClick={onToggle}
      >
        <span aria-hidden="true">{following ? 'Following' : 'Follow'}</span>
      </Button>
    </li>
  )
}
