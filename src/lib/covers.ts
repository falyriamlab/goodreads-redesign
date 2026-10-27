/**
 * Self-hosted covers (`npm run covers`):
 * - JPG from Open Library: M (≈180px wide) in public/covers/, L (≈330px) in public/covers/l/
 * - WebP made from the L at 180, 240 and 333px (quality 0.75) in public/covers/w/
 * The app serves the WebP sizes first (<picture>), with the JPGs as fallback. Share cards paint the L JPG.
 */
export const COVER_WIDTH = { m: 180, l: 330 }
export const WEBP_WIDTHS = [180, 240, 333] as const

const LOCAL = '/covers/'
const LARGE = '/covers/l/'
const ISBN_FILE = /^\/covers\/(?:l\/)?(\d{13})\.jpg$/

/** The L version of a self-hosted cover. Other URLs (and L URLs) come back unchanged. */
export function largeCoverUrl(url: string): string {
  return url.startsWith(LOCAL) && !url.startsWith(LARGE) ? LARGE + url.slice(LOCAL.length) : url
}

export function isSelfHostedCover(url: string): boolean {
  return url.startsWith(LOCAL)
}

/** srcset strings for a self-hosted cover, or null for any other URL */
export function coverSrcSets(url: string): { webp: string; jpg: string } | null {
  const isbn = url.match(ISBN_FILE)?.[1]
  if (!isbn) return null
  return {
    webp: WEBP_WIDTHS.map((w) => `/covers/w/${isbn}-${w}.webp ${w}w`).join(', '),
    jpg: `${LOCAL}${isbn}.jpg ${COVER_WIDTH.m}w, ${LARGE}${isbn}.jpg ${COVER_WIDTH.l}w`,
  }
}
