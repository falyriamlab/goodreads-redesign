import { Search } from 'lucide-react'
import { Link } from 'react-router'
import { TopBar } from '@/components/layout/TopBar'

export function DiscoverPage() {
  return (
    <>
      <TopBar title="Discover" />
      <div className="px-4 py-3">
        {/* Entry point to Search (not a tab). Looks like a field, behaves like a link. */}
        <Link
          to="/discover/search"
          className="flex min-h-11 items-center gap-2 rounded-lg border border-input bg-card px-3 text-sm text-muted-foreground transition-colors outline-none hover:border-ring focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <Search className="size-4 shrink-0" aria-hidden="true" />
          <span>Search books, authors, tropes…</span>
        </Link>
      </div>
    </>
  )
}
