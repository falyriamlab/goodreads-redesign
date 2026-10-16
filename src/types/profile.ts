export type ProfileSection = 'reviews' | 'lists' | 'journal' | 'stats'

export type Profile = {
  displayName: string
  /** Without the @ */
  handle: string
  city: string
  /** Max 160 characters */
  bio: string
  /** Up to 4 book ids, in display order */
  favorites: string[]
  /** Which sections visitors can see */
  publicSections: Record<ProfileSection, boolean>
}
