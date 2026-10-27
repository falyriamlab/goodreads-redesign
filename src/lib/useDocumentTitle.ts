import { useEffect } from 'react'

export const APP_TITLE = 'Goodreads Concept'

/** "{Screen} · Goodreads Concept" in the browser tab, history and screen reader announcements; updates on navigation */
export function useDocumentTitle(screen: string | undefined) {
  useEffect(() => {
    if (screen) document.title = `${screen} · ${APP_TITLE}`
  }, [screen])
}
