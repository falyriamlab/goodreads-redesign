import { useId, useState } from 'react'
import { Table2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export type Datum = {
  label: string
  /** Long label for the table / summary ("January" for "Jan") */
  fullLabel?: string
  value: number
  /** Text written on the bar and in the table ("1.2k", "33%") */
  display?: string
}

type ChartCardProps = {
  title: string
  /** Column headers for the table view */
  columns: [string, string]
  data: Datum[]
  kind: 'columns' | 'bars'
}

/**
 * A chart with its numbers written on it and a "Show as table" alternative.
 * Nothing depends on color: every value is printed.
 */
export function ChartCard({ title, columns, data, kind }: ChartCardProps) {
  const [table, setTable] = useState(false)
  const ids = { title: useId(), table: useId() }

  return (
    <section aria-labelledby={ids.title} className="space-y-4 rounded-xl border border-border bg-card p-4 text-card-foreground">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id={ids.title} className="section-title">
          {title}
        </h2>
        <Button
          variant="ghost"
          className="min-h-11 px-2"
          aria-expanded={table}
          aria-controls={ids.table}
          onClick={() => setTable((t) => !t)}
        >
          <Table2 aria-hidden="true" />
          {table ? 'Show as chart' : 'Show as table'}
        </Button>
      </div>

      {table ? (
        <table id={ids.table} className="w-full text-sm">
          <caption className="sr-only">{title}</caption>
          <thead>
            <tr className="border-b border-border text-left">
              <th scope="col" className="py-2 font-semibold">
                {columns[0]}
              </th>
              <th scope="col" className="py-2 text-right font-semibold">
                {columns[1]}
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.label} className="border-b border-border last:border-b-0">
                <th scope="row" className="py-1.5 text-left font-normal">
                  {d.fullLabel ?? d.label}
                </th>
                <td className="py-1.5 text-right tabular-nums">{d.display ?? d.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : kind === 'columns' ? (
        <ColumnChart title={title} data={data} />
      ) : (
        <BarList data={data} />
      )}
      {/* Keeps aria-controls valid while the chart is showing */}
      {!table && <div id={ids.table} hidden />}
    </section>
  )
}

/** Vertical bars in hand-made SVG; value printed above each bar */
function ColumnChart({ title, data }: { title: string; data: Datum[] }) {
  const ids = { title: useId(), desc: useId() }
  const W = 340
  const H = 170
  const top = 20
  const bottom = 22
  const max = Math.max(1, ...data.map((d) => d.value))
  const slot = W / data.length
  const barW = Math.min(22, slot * 0.6)
  const summary = data.map((d) => `${d.fullLabel ?? d.label}: ${d.display ?? d.value}`).join(', ')

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-labelledby={`${ids.title} ${ids.desc}`}>
      <title id={ids.title}>{title}</title>
      <desc id={ids.desc}>{summary}</desc>
      <line x1={0} x2={W} y1={H - bottom} y2={H - bottom} className="stroke-border" strokeWidth={1} />
      {data.map((d, i) => {
        const h = ((H - top - bottom) * d.value) / max
        const x = i * slot + (slot - barW) / 2
        const y = H - bottom - h
        return (
          <g key={d.label}>
            {d.value > 0 && <rect x={x} y={y} width={barW} height={h} rx={3} className="fill-primary" />}
            {d.value > 0 && (
              <text x={x + barW / 2} y={y - 5} textAnchor="middle" className="fill-foreground text-[10px] font-semibold">
                {d.display ?? d.value}
              </text>
            )}
            <text x={x + barW / 2} y={H - 6} textAnchor="middle" className="fill-muted-foreground text-[10px]">
              {d.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

/** Horizontal bars as HTML; label and value always written next to the bar */
function BarList({ data }: { data: Datum[] }) {
  const max = Math.max(1, ...data.map((d) => d.value))
  return (
    <ul className="space-y-2">
      {data.map((d) => (
        <li key={d.label} className="space-y-1">
          <div className="flex justify-between gap-3 text-sm">
            <span>{d.fullLabel ?? d.label}</span>
            <span className="font-semibold tabular-nums">{d.display ?? d.value}</span>
          </div>
          <div aria-hidden="true" className="h-2.5 overflow-hidden rounded-full bg-track">
            <div className="h-full rounded-full bg-primary" style={{ width: `${(d.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  )
}
