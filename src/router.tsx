import { createBrowserRouter } from 'react-router'
import { AppShell } from '@/components/layout/AppShell'
import { RootLayout } from '@/components/layout/RootLayout'
import { RouteError } from '@/components/layout/RouteError'
import {
  BookPage,
  BuddyReadPage,
  CommunityPage,
  ComponentsPage,
  ConversationPage,
  DiscoverPage,
  EditProfilePage,
  FindFriendsPage,
  GroupPage,
  HomePage,
  InvitePage,
  JournalPage,
  LazyPage,
  LibraryPage,
  MessagesPage,
  NotFoundPage,
  NotificationsPage,
  ProfilePage,
  ResultsPage,
  SearchPage,
  SettingsPage,
  SharePage,
  StatsPage,
  ThreadPage,
  VisitorProfilePage,
} from '@/pages/lazyPages'

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    // Last resort (invite page, dev page, the shell itself): the recovery screen fills the page
    errorElement: <RouteError />,
    children: [
      // Dev-only playground, outside the app shell (no bottom nav)
      { path: '/dev/components', element: <LazyPage page={ComponentsPage} /> },
      // Invite landing: for people who aren't members yet, so no app shell
      { path: '/invite/:handle', element: <LazyPage page={InvitePage} /> },
      {
        element: <AppShell />,
        children: [
          {
            // A page that fails to render or load (offline, a chunk gone after a deploy) shows the recovery
            // screen inside the shell, so the bottom nav still works
            errorElement: <RouteError />,
            children: [
              { path: '/', element: <LazyPage page={HomePage} /> },
              { path: '/discover', element: <LazyPage page={DiscoverPage} /> },
              { path: '/discover/search', element: <LazyPage page={SearchPage} /> },
              { path: '/discover/results', element: <LazyPage page={ResultsPage} /> },
              { path: '/library', element: <LazyPage page={LibraryPage} /> },
              { path: '/library/journal', element: <LazyPage page={JournalPage} /> },
              { path: '/community', element: <LazyPage page={CommunityPage} /> },
              { path: '/community/find', element: <LazyPage page={FindFriendsPage} /> },
              { path: '/community/buddy/:id', element: <LazyPage page={BuddyReadPage} /> },
              { path: '/community/groups/:id', element: <LazyPage page={GroupPage} /> },
              { path: '/community/groups/:groupId/threads/:threadId', element: <LazyPage page={ThreadPage} /> },
              { path: '/notifications', element: <LazyPage page={NotificationsPage} /> },
              { path: '/messages', element: <LazyPage page={MessagesPage} /> },
              { path: '/messages/:id', element: <LazyPage page={ConversationPage} /> },
              { path: '/profile', element: <LazyPage page={ProfilePage} /> },
              { path: '/profile/edit', element: <LazyPage page={EditProfilePage} /> },
              { path: '/profile/stats', element: <LazyPage page={StatsPage} /> },
              { path: '/settings', element: <LazyPage page={SettingsPage} /> },
              { path: '/u/:handle', element: <LazyPage page={VisitorProfilePage} /> },
              { path: '/book/:id', element: <LazyPage page={BookPage} /> },
              { path: '/share', element: <LazyPage page={SharePage} /> },
              { path: '*', element: <LazyPage page={NotFoundPage} /> },
            ],
          },
        ],
      },
    ],
  },
])
