import { createBrowserRouter } from 'react-router'
import { AppShell } from '@/components/layout/AppShell'
import { RootLayout } from '@/components/layout/RootLayout'
import { BookPage } from '@/pages/BookPage'
import { CommunityPage } from '@/pages/CommunityPage'
import { ComponentsPage } from '@/pages/dev/ComponentsPage'
import { DiscoverPage } from '@/pages/DiscoverPage'
import { HomePage } from '@/pages/HomePage'
import { LibraryPage } from '@/pages/LibraryPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { SearchPage } from '@/pages/SearchPage'
import { SharePage } from '@/pages/SharePage'

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      // Dev-only playground, outside the app shell (no bottom nav)
      { path: '/dev/components', element: <ComponentsPage /> },
      {
        element: <AppShell />,
        children: [
          { path: '/', element: <HomePage /> },
          { path: '/discover', element: <DiscoverPage /> },
          { path: '/discover/search', element: <SearchPage /> },
          { path: '/library', element: <LibraryPage /> },
          { path: '/community', element: <CommunityPage /> },
          { path: '/profile', element: <ProfilePage /> },
          { path: '/book/:id', element: <BookPage /> },
          { path: '/share', element: <SharePage /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
])
