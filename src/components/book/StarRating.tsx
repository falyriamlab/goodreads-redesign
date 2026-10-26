import { useRef, type KeyboardEvent, type PointerEvent } from 'react'
import { Star } from 'lucide-react'
import { RATING_MAX as MAX, RATING_STEP as STEP, formatRating, normalizeRating } from '@/lib/rating'
import { cn } from '@/lib/utils'

type StarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

const starSize: Record<StarSize, string> = {
  xs: 'size-3',
  sm: 'size-4',
  md: 'size-5',
  lg: 'size-9',
  xl: 'size-16',
}

function ratingText(value: number): string {
  return `${formatRating(value)} ${value === 1 ? 'star' : 'stars'}`
}

/** One star: outline always visible, solid fill clipped to `fill` (0–1). Filled vs empty differs by shape, not hue. */
/** tone "current": stars take the text color (on --primary: the challenge band and the Brand share card, where amber lacks contrast; dark stone in dark mode) */
type Tone = 'rating' | 'current'
const toneClass: Record<Tone, { stroke: string; fill: string }> = {
  rating: { stroke: 'text-rating', fill: 'fill-rating text-rating' },
  current: { stroke: 'text-current', fill: 'fill-current text-current' },
}

function StarGlyph({ fill, size, tone }: { fill: number; size: StarSize; tone: Tone }) {
  return (
    <span className={cn('relative inline-block shrink-0', starSize[size])} aria-hidden="true">
      <Star className={cn('absolute inset-0 size-full', toneClass[tone].stroke)} strokeWidth={1.75} />
      <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
        <Star className={cn(toneClass[tone].fill, starSize[size])} strokeWidth={1.75} />
      </span>
    </span>
  )
}

function Stars({ value, size, tone = 'rating' }: { value: number; size: StarSize; tone?: Tone }) {
  return (
    <span className="flex">
      {Array.from({ length: MAX }, (_, i) => (
        <StarGlyph key={i} size={size} tone={tone} fill={Math.min(1, Math.max(0, value - i))} />
      ))}
    </span>
  )
}

type DisplayProps = {
  mode?: 'display'
  value: number | null
  size?: StarSize
  /** Show the number next to the stars */
  showValue?: boolean
  tone?: Tone
  className?: string
}

type InputProps = {
  mode: 'input'
  value: number | null
  onChange: (value: number) => void
  /** Accessible name, e.g. "Your rating for Fourth Wing" */
  label: string
  size?: StarSize
  className?: string
}

export function StarRating(props: DisplayProps | InputProps) {
  if (props.mode === 'input') return <StarRatingInput {...props} />

  const { value, size = 'sm', showValue = false, className, tone = 'rating' } = props
  if (value === null) {
    return <span className={cn('text-xs text-muted-foreground', className)}>Not rated yet</span>
  }
  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <span role="img" aria-label={`Rated ${formatRating(value)} out of 5 stars`}>
        <Stars value={value} size={size} tone={tone} />
      </span>
      {showValue && (
        <span aria-hidden="true" className="font-mono text-xs font-medium text-foreground tabular-nums">
          {formatRating(value)}
        </span>
      )}
    </span>
  )
}

function StarRatingInput({ value, onChange, label, size = 'lg', className }: InputProps) {
  const current = value ?? 0
  const trackRef = useRef<HTMLSpanElement>(null)

  function valueFromPointer(clientX: number) {
    const rect = trackRef.current!.getBoundingClientRect()
    const raw = ((clientX - rect.left) / rect.width) * MAX
    // Round up so tapping anywhere on the right half of star 3 gives 3, never less than one step
    return Math.min(MAX, Math.max(STEP, Math.ceil(raw / STEP) * STEP))
  }

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId)
    e.currentTarget.focus()
    onChange(valueFromPointer(e.clientX))
  }

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return
    const next = valueFromPointer(e.clientX)
    if (next !== current) onChange(next)
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const keys: Record<string, number> = {
      ArrowRight: current + STEP,
      ArrowUp: current + STEP,
      ArrowLeft: current - STEP,
      ArrowDown: current - STEP,
      PageUp: current + 1,
      PageDown: current - 1,
      Home: 0,
      End: MAX,
    }
    if (!(e.key in keys)) return
    e.preventDefault()
    onChange(normalizeRating(keys[e.key]))
  }

  return (
    <div className={cn('inline-flex items-center gap-3', className)}>
      <div
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={MAX}
        aria-valuenow={current}
        aria-valuetext={value === null ? 'Not rated' : ratingText(current)}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onKeyDown={onKeyDown}
        className="cursor-pointer touch-none rounded-md py-1 outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <span ref={trackRef} className="flex">
          <Stars value={current} size={size} />
        </span>
      </div>
      {/* Visual readout; screen readers get it from aria-valuetext */}
      <span aria-hidden="true" className="min-w-10 font-mono text-sm font-semibold text-foreground tabular-nums">
        {value === null ? '–' : formatRating(current)}
      </span>
    </div>
  )
}
