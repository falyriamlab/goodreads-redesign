import { Heart } from 'lucide-react'
import { cn } from '@/lib/utils'

type LovedButtonProps = {
  pressed: boolean
  onPressedChange: (pressed: boolean) => void
  /** Icon-only version; the label then lives in aria-label */
  iconOnly?: boolean
  className?: string
}

export function LovedButton({ pressed, onPressedChange, iconOnly = false, className }: LovedButtonProps) {
  const label = pressed ? 'Obsessed' : 'Love it'

  return (
    <button
      type="button"
      aria-pressed={pressed}
      aria-label={iconOnly ? label : undefined}
      onClick={() => onPressedChange(!pressed)}
      className={cn(
        'inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-full text-sm transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
        !iconOnly && 'border px-4',
        // Pressed state = filled heart + bold label + filled surface (not hue alone)
        pressed
          ? cn('font-semibold text-foreground', !iconOnly && 'border-foreground bg-muted')
          : cn('font-medium text-foreground', !iconOnly && 'border-input bg-background hover:bg-muted'),
        className,
      )}
    >
      <Heart className={cn('size-5', pressed && 'fill-current')} strokeWidth={2} aria-hidden="true" />
      {!iconOnly && <span>{label}</span>}
    </button>
  )
}
