import { cn } from '@/lib/utils'

type Props = {
  percent: number
  label?: string
  /** Use instead of label when a visible heading names the bar */
  labelledBy?: string
  valueText: string
  /** ink: the reading challenge. --foreground fill on the --track instead of --primary */
  tone?: 'default' | 'ink'
  className?: string
}

/**
 * Progress bar. One of the system's two motions: the fill grows in on mount (motion-safe only).
 * The numbers are always written next to it, so the bar is never the only carrier.
 */
export function ProgressBar({ percent, label, labelledBy, valueText, tone = 'default', className }: Props) {
  const value = Math.max(0, Math.min(100, percent))
  return (
    <div
      role="progressbar"
      aria-label={labelledBy ? undefined : label}
      aria-labelledby={labelledBy}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      aria-valuetext={valueText}
      className={cn('h-2 overflow-hidden rounded-full', 'bg-track', className)}
    >
      <div
        className={cn(
          'h-full origin-left rounded-full motion-safe:animate-[fill-in_700ms_cubic-bezier(0.2,0.8,0.2,1)_both]',
          tone === 'ink' ? 'bg-foreground' : 'bg-primary',
        )}
        style={{ width: `${value}%` }}
      />
    </div>
  )
}
