import { Heart } from 'lucide-react'
import { cn } from '@/lib/utils'

type LovedButtonProps = {
  pressed: boolean
  onPressedChange: (pressed: boolean) => void
  /** Icon-only version */
  iconOnly?: boolean
  className?: string
}

/**
 * Toggle button: the accessible name stays "Love it" and aria-pressed carries the state
 * (WAI-ARIA: a toggle's label shouldn't change). "Obsessed" is visual-only flavor text.
 */
export function LovedButton({ pressed, onPressedChange, iconOnly = false, className }: LovedButtonProps) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      aria-label="Love it"
      onClick={() => onPressedChange(!pressed)}
      className={cn(
        'inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-1.5 rounded-full text-sm text-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        !iconOnly && 'border px-4',
        // Pressed = filled heart + bold label + filled surface (not hue alone)
        pressed
          ? cn('font-semibold', !iconOnly && 'border-foreground bg-muted')
          : cn('font-medium', iconOnly ? 'hover:bg-muted' : 'border-input bg-background hover:bg-muted'),
        className,
      )}
    >
      <Heart className={cn('size-5', pressed && 'fill-current')} strokeWidth={2} aria-hidden="true" />
      {!iconOnly && <span aria-hidden="true">{pressed ? 'Obsessed' : 'Love it'}</span>}
    </button>
  )
}
