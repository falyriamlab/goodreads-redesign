import { lazy, Suspense, type ComponentType, type LazyExoticComponent } from 'react'
import { PageSkeleton } from '@/components/layout/PageSkeleton'

// Each page is its own chunk. Pages use named exports, so map them to `default` for React.lazy.
export const HomePage = lazy(() => import('./HomePage').then((m) => ({ default: m.HomePage })))
export const DiscoverPage = lazy(() => import('./DiscoverPage').then((m) => ({ default: m.DiscoverPage })))
export const ResultsPage = lazy(() => import('./ResultsPage').then((m) => ({ default: m.ResultsPage })))
export const SearchPage = lazy(() => import('./SearchPage').then((m) => ({ default: m.SearchPage })))
export const JournalPage = lazy(() => import('./JournalPage').then((m) => ({ default: m.JournalPage })))
export const LibraryPage = lazy(() => import('./LibraryPage').then((m) => ({ default: m.LibraryPage })))
export const CommunityPage = lazy(() => import('./CommunityPage').then((m) => ({ default: m.CommunityPage })))
export const ProfilePage = lazy(() => import('./ProfilePage').then((m) => ({ default: m.ProfilePage })))
export const BookPage = lazy(() => import('./BookPage').then((m) => ({ default: m.BookPage })))
export const SharePage = lazy(() => import('./SharePage').then((m) => ({ default: m.SharePage })))
export const NotFoundPage = lazy(() => import('./NotFoundPage').then((m) => ({ default: m.NotFoundPage })))
// Dev-only playground: its own chunk, never loaded by the app itself
export const ComponentsPage = lazy(() => import('./dev/ComponentsPage').then((m) => ({ default: m.ComponentsPage })))

/** Suspense boundary with the skeleton while a page chunk loads */
export function LazyPage({ page: Page }: { page: LazyExoticComponent<ComponentType> }) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Page />
    </Suspense>
  )
}
