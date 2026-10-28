import { createContext, useContext, useEffect } from 'react'
import type { ReadingStatus } from '@/types/library'
import { schedulePreload } from './preload'

export type LogSheetOptions = {
  /** Preselected status, e.g. "read" after choosing Read in a StatusChip */
  intent?: ReadingStatus
  /** Prefilled rating (rating a book that isn't Read yet) */
  rating?: number
  /** Move focus to the review field on open ("Write a review") */
  focus?: 'review'
  /** Element to focus when the sheet closes; defaults to whatever was focused on open */
  returnFocus?: HTMLElement | null
}

export type LogSheetApi = {
  open: (bookId: string, options?: LogSheetOptions) => void
}

export const LogSheetContext = createContext<LogSheetApi | null>(null)

/** Every control that can open the sheet calls this, so its chunk is preloaded once one is on screen */
export function useLogSheet(): LogSheetApi {
  const ctx = useContext(LogSheetContext)
  if (!ctx) throw new Error('useLogSheet must be used inside <LogSheetProvider>')
  useEffect(() => schedulePreload(), [])
  return ctx
}
