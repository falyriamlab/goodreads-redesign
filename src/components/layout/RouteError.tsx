import { CircleAlert } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useRouteError } from 'react-router'
import { Button } from '@/components/ui/button'
import { reloadOnceForChunkError } from '@/lib/chunkReload'
import { useOnline } from '@/lib/useOnline'

/**
 * Recovery screen for any page that fails to render or load (offline, a chunk gone after a deploy).
 * Inside the app shell it replaces only the page, so the bottom nav stays.
 */
export function RouteError() {
  const error = useRouteError()
  const navigate = useNavigate()
  const online = useOnline()
  const [stillOffline, setStillOffline] = useState(false)
  // A chunk from an old deploy: reload once (render-time is fine: the page is about to go away)
  const [reloading] = useState(() => reloadOnceForChunkError(error))
  if (reloading) return null

  return (
    <section aria-labelledby="route-error-title" className="flex flex-1 flex-col justify-center gap-6 px-4 py-10">
      <CircleAlert className="size-10 text-muted-foreground" aria-hidden="true" />
      <div className="space-y-2">
        <h1 id="route-error-title" className="text-2xl leading-tight font-bold tracking-tight">
          Something went wrong loading this page
        </h1>
        <p className="text-muted-foreground">
          {online ? "Not you, it's us. Give it another go." : "You're offline right now. Reconnect, then try again."}
        </p>
        <p role="status" className="text-sm font-semibold">
          {stillOffline && !online ? "Still offline. Try again once you're back online." : ''}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Button
          size="lg"
          className="min-h-11"
          onClick={() => {
            // Offline, a reload would only show the browser's own error page
            if (!navigator.onLine) setStillOffline(true)
            else window.location.reload()
          }}
        >
          Try again
        </Button>
        <Button size="lg" variant="outline" className="min-h-11 border-muted-foreground" onClick={() => navigate('/')}>
          Go home
        </Button>
      </div>
    </section>
  )
}
