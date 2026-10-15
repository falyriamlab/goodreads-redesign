import { Link } from 'react-router'
import { TopBar } from '@/components/layout/TopBar'

export function NotFoundPage() {
  return (
    <>
      <TopBar title="Page not found" back />
      <div className="space-y-3 px-4 py-6">
        <p className="text-muted-foreground">This page said "brb" and never came back.</p>
        <Link to="/" className="inline-flex min-h-11 items-center font-medium text-foreground underline underline-offset-4">
          Go to Home
        </Link>
      </div>
    </>
  )
}
