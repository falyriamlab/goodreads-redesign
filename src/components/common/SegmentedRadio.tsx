import { useRef, type KeyboardEvent } from 'react'
import { cn } from '@/lib/utils'

type Option<T extends string> = { value: T; label: string; disabled?: boolean }

type SegmentedRadioProps<T extends string> = {
  options: Option<T>[]
  value: T
  onChange: (value: T) => void
  labelledBy: string
  /** id of helper text */
  describedBy?: string
  className?: string
}

/**
 * Segmented control with radiogroup semantics (WAI-ARIA APG radio pattern):
 * one tab stop, arrows move focus AND select, Home/End jump, disabled options are skipped.
 */
export function SegmentedRadio<T extends string>({
  options,
  value,
  onChange,
  labelledBy,
  describedBy,
  className,
}: SegmentedRadioProps<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const enabled = options.map((o, i) => (o.disabled ? -1 : i)).filter((i) => i >= 0)

  function select(index: number) {
    onChange(options[index].value)
    refs.current[index]?.focus()
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const pos = enabled.indexOf(index)
    const moves: Record<string, number> = {
      ArrowRight: enabled[(pos + 1) % enabled.length],
      ArrowDown: enabled[(pos + 1) % enabled.length],
      ArrowLeft: enabled[(pos - 1 + enabled.length) % enabled.length],
      ArrowUp: enabled[(pos - 1 + enabled.length) % enabled.length],
      Home: enabled[0],
      End: enabled[enabled.length - 1],
    }
    if (!(event.key in moves)) return
    event.preventDefault()
    select(moves[event.key])
  }

  return (
    <div
      role="radiogroup"
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      className={cn('grid grid-flow-col auto-cols-fr overflow-hidden rounded-lg border border-muted-foreground', className)}
    >
      {options.map((option, i) => {
        const checked = option.value === value
        return (
          <button
            key={option.value}
            ref={(el) => {
              refs.current[i] = el
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            disabled={option.disabled}
            // Roving tabindex: only the checked option is in the tab order
            tabIndex={checked ? 0 : -1}
            onClick={() => select(i)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cn(
              'min-h-11 px-1 text-xs leading-tight font-medium text-foreground outline-none focus-visible:z-10 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset disabled:opacity-50',
              i > 0 && 'border-l border-muted-foreground',
              // Checked = filled + bold (not hue alone)
              checked && 'bg-primary font-semibold text-primary-foreground',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
