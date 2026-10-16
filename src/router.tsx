import { createBrowserRouter } from 'react-router'
import { AppShell } from '@/components/layout/AppShell'
import { RootLayout } from '@/components/layout/RootLayout'
import {
  BookPage,
  CommunityPage,
  ComponentsPage,
  DiscoverPage,
  HomePage,
  LazyPage,
  LibraryPage,
  NotFoundPage,
  ProfilePage,
  SearchPage,
  SharePage,
} from '@/pages/lazyPages'

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      // Dev-only playground, outside the app shell (no bottom nav)
      { path: '/dev/components', element: <LazyPage page={ComponentsPage} /> },
      {
        element: <AppShell />,
        children: [
          { path: '/', element: <LazyPage page={HomePage} /> },
          { path: '/discover', element: <LazyPage page={DiscoverPage} /> },
          { path: '/discover/search', element: <LazyPage page={SearchPage} /> },
          { path: '/library', element: <LazyPage page={LibraryPage} /> },
          { path: '/community', element: <LazyPage page={CommunityPage} /> },
          { path: '/profile', element: <LazyPage page={ProfilePage} /> },
          { path: '/book/:id', element: <LazyPage page={BookPage} /> },
          { path: '/share', element: <LazyPage page={SharePage} /> },
          { path: '*', element: <LazyPage page={NotFoundPage} /> },
        ],
      },
    ],
  },
])
