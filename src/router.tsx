import { lazy, Suspense, type ComponentType, type LazyExoticComponent } from 'react'
import { createBrowserRouter } from 'react-router'
import { AppShell } from '@/components/layout/AppShell'
import { PageSkeleton } from '@/components/layout/PageSkeleton'
import { RootLayout } from '@/components/layout/RootLayout'

// Each page is its own chunk. Pages use named exports, so map them to `default` for React.lazy.
const HomePage = lazy(() => import('@/pages/HomePage').then((m) => ({ default: m.HomePage })))
const DiscoverPage = lazy(() => import('@/pages/DiscoverPage').then((m) => ({ default: m.DiscoverPage })))
const SearchPage = lazy(() => import('@/pages/SearchPage').then((m) => ({ default: m.SearchPage })))
const LibraryPage = lazy(() => import('@/pages/LibraryPage').then((m) => ({ default: m.LibraryPage })))
const CommunityPage = lazy(() => import('@/pages/CommunityPage').then((m) => ({ default: m.CommunityPage })))
const ProfilePage = lazy(() => import('@/pages/ProfilePage').then((m) => ({ default: m.ProfilePage })))
const BookPage = lazy(() => import('@/pages/BookPage').then((m) => ({ default: m.BookPage })))
const SharePage = lazy(() => import('@/pages/SharePage').then((m) => ({ default: m.SharePage })))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })))
const ComponentsPage = lazy(() => import('@/pages/dev/ComponentsPage').then((m) => ({ default: m.ComponentsPage })))

function page(Page: LazyExoticComponent<ComponentType>) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Page />
    </Suspense>
  )
}

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      // Dev-only playground, outside the app shell (no bottom nav), in its own chunk
      { path: '/dev/components', element: page(ComponentsPage) },
      {
        element: <AppShell />,
        children: [
          { path: '/', element: page(HomePage) },
          { path: '/discover', element: page(DiscoverPage) },
          { path: '/discover/search', element: page(SearchPage) },
          { path: '/library', element: page(LibraryPage) },
          { path: '/community', element: page(CommunityPage) },
          { path: '/profile', element: page(ProfilePage) },
          { path: '/book/:id', element: page(BookPage) },
          { path: '/share', element: page(SharePage) },
          { path: '*', element: page(NotFoundPage) },
        ],
      },
    ],
  },
])
