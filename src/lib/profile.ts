export const MAX_FAVORITES = 4
export const BIO_MAX = 160

const HANDLE_RE = /^[a-z0-9_]{3,20}$/

export const HANDLE_ERROR = 'Use 3–20 lowercase letters, numbers or underscores.'

/** null when valid, otherwise the error message */
export function validateHandle(handle: string): string | null {
  return HANDLE_RE.test(handle) ? null : HANDLE_ERROR
}

/* ---------- Top 4 favorites: pure helpers (the store and the editor both use them) ---------- */

/** Appends if there's room and it isn't already there */
export function addFavorite(list: string[], id: string): string[] {
  if (list.includes(id) || list.length >= MAX_FAVORITES) return list
  return [...list, id]
}

export function removeFavorite(list: string[], id: string): string[] {
  return list.filter((x) => x !== id)
}

/** Moves `id` to `toIndex` (clamped) */
export function moveFavorite(list: string[], id: string, toIndex: number): string[] {
  if (!list.includes(id)) return list
  const rest = list.filter((x) => x !== id)
  const index = Math.max(0, Math.min(rest.length, toIndex))
  return [...rest.slice(0, index), id, ...rest.slice(index)]
}

/** Dedupes and caps at 4, keeping order */
export function normalizeFavorites(list: string[]): string[] {
  return [...new Set(list)].slice(0, MAX_FAVORITES)
}
