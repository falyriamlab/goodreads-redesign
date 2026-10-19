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

/** ISO date-time without a zone is read as local time. Future times (clock skew) read as "just now". */
export function formatTimeAgo(iso: string, now = new Date()): string {
  const minutes = Math.floor((now.getTime() - new Date(iso).getTime()) / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return formatShortDate(iso.slice(0, 10), now)
}

/** Message list time: "8:25 AM" today, "Yesterday", "Mon" this week, else "Oct 12" */
export function formatMessageTime(iso: string, now = new Date()): string {
  const d = new Date(iso)
  const startOfDay = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const days = Math.round((startOfDay(now) - startOfDay(d)) / DAY)
  if (days <= 0) return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  if (days === 1) return 'Yesterday'
  if (days < 7) return d.toLocaleDateString('en-US', { weekday: 'short' })
  return formatShortDate(iso.slice(0, 10), now)
}

/** Local date-time as an ISO string without a zone, like the mock data */
export function nowISO(now = new Date()): string {
  const offset = now.getTimezoneOffset() * 60 * 1000
  return new Date(now.getTime() - offset).toISOString().slice(0, 19)
}
