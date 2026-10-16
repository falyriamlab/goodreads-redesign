const DAY = 24 * 60 * 60 * 1000

/** Local date as YYYY-MM-DD (what <input type="date"> uses) */
export function todayISO(now = new Date()): string {
  const offset = now.getTimezoneOffset() * 60 * 1000
  return new Date(now.getTime() - offset).toISOString().slice(0, 10)
}

/** "today", "3d", "2w", "4mo", "1y" */
export function formatRelative(iso: string, now = new Date()): string {
  const days = Math.floor((now.getTime() - new Date(`${iso}T00:00:00`).getTime()) / DAY)
  if (days < 1) return 'today'
  if (days < 7) return `${days}d`
  if (days < 30) return `${Math.floor(days / 7)}w`
  if (days < 365) return `${Math.floor(days / 30)}mo`
  return `${Math.floor(days / 365)}y`
}

/** "Oct 2, 2026" */
export function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

/** "Mar 12" (adds the year when it isn't the current one: "Mar 12, 2025") */
export function formatShortDate(iso: string, now = new Date()): string {
  const d = new Date(`${iso}T00:00:00`)
  const sameYear = d.getFullYear() === now.getFullYear()
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', ...(sameYear ? {} : { year: 'numeric' }) })
}
