import { BookOpen, Bookmark, Check, CircleSlash, type LucideIcon } from 'lucide-react'
import type { ReadingStatus } from '@/types/library'

/** Label + icon per status, so states never rely on color alone */
export const statusMeta: Record<ReadingStatus, { label: string; menuLabel: string; icon: LucideIcon }> = {
  want: { label: 'Want to read', menuLabel: 'Want to read', icon: Bookmark },
  reading: { label: 'Reading', menuLabel: 'Currently reading', icon: BookOpen },
  read: { label: 'Read', menuLabel: 'Read', icon: Check },
  dnf: { label: 'DNF', menuLabel: 'Did not finish (DNF)', icon: CircleSlash },
}

export const statusOrder: ReadingStatus[] = ['want', 'reading', 'read', 'dnf']
