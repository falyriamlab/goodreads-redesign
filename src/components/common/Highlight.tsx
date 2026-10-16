import type { ReactNode } from 'react'

/** Wraps [start, end] (inclusive) ranges in <mark>: accent fill + bold, so it's not color alone */
export function Highlight({ text, ranges = [] }: { text: string; ranges?: [number, number][] }): ReactNode {
  if (ranges.length === 0) return text
  const sorted = [...ranges].sort((a, b) => a[0] - b[0])
  const parts: ReactNode[] = []
  let cursor = 0
  for (const [start, end] of sorted) {
    if (start < cursor) continue
    if (start > cursor) parts.push(text.slice(cursor, start))
    parts.push(
      <mark key={start} className="rounded-sm bg-accent px-0.5 font-bold text-accent-foreground">
        {text.slice(start, end + 1)}
      </mark>,
    )
    cursor = end + 1
  }
  if (cursor < text.length) parts.push(text.slice(cursor))
  return parts
}
