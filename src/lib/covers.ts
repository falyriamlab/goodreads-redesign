/**
 * Self-hosted covers come in two sizes (`npm run covers`): Open Library's M (≈180px wide) in public/covers/
 * and L (≈330px wide) in public/covers/l/. M is enough for small thumbnails; anything shown wider than
 * ~120px (the book page hero, share cards) needs L to stay sharp on 2–3x screens.
 */
export const COVER_WIDTH = { m: 180, l: 330 }

const LOCAL = '/covers/'
const LARGE = '/covers/l/'

/** The L version of a self-hosted cover. Other URLs (and L URLs) come back unchanged. */
export function largeCoverUrl(url: string): string {
  return url.startsWith(LOCAL) && !url.startsWith(LARGE) ? LARGE + url.slice(LOCAL.length) : url
}

export function isSelfHostedCover(url: string): boolean {
  return url.startsWith(LOCAL)
}
