import { createBrowserRouter } from 'react-router'
import { AppShell } from '@/components/layout/AppShell'
import { BookPage } from '@/pages/BookPage'
import { CommunityPage } from '@/pages/CommunityPage'
import { DiscoverPage } from '@/pages/DiscoverPage'
import { HomePage } from '@/pages/HomePage'
import { LibraryPage } from '@/pages/LibraryPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { SearchPage } from '@/pages/SearchPage'

export const router = createBrowserRouter([
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
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
