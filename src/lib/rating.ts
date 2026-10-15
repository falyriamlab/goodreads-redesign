export const RATING_MAX = 5
export const RATING_STEP = 0.25

/** Clamps to 0–5 and snaps to the nearest 0.25 */
export function normalizeRating(value: number): number {
  return Math.min(RATING_MAX, Math.max(0, Math.round(value / RATING_STEP) * RATING_STEP))
}

/** "4.25", "4.5", "4" — no trailing zeros */
export function formatRating(value: number): string {
  return String(Number(value.toFixed(2)))
}
