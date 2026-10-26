/** Suspense fallback while a page chunk loads: theme tokens only, hidden from AT except the status */
export function PageSkeleton() {
  return (
    <div role="status" className="animate-pulse">
      <span className="sr-only">Loading…</span>
      <div aria-hidden="true">
        <div className="flex h-14 items-center border-b border-border px-4">
          <div className="h-5 w-32 rounded-md bg-muted" />
        </div>
        <div className="space-y-4 p-4">
          <div className="flex gap-3">
            <div className="aspect-2/3 w-26 rounded-cover bg-muted" />
            <div className="flex-1 space-y-2 pt-1">
              <div className="h-4 w-3/4 rounded-md bg-muted" />
              <div className="h-3 w-1/2 rounded-md bg-muted" />
              <div className="h-3 w-1/3 rounded-md bg-muted" />
            </div>
          </div>
          <div className="h-24 rounded-xl bg-muted" />
          <div className="h-4 w-1/3 rounded-md bg-muted" />
          <div className="h-32 rounded-xl bg-muted" />
        </div>
      </div>
    </div>
  )
}
