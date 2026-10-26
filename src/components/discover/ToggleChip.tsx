import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

type ToggleChipProps = {
  label: string
  pressed: boolean
  onPressedChange: (pressed: boolean) => void
}

/** Multi-select pill: aria-pressed; "on" = stone fill + bold + check icon (neutral, never color alone) */
export function ToggleChip({ label, pressed, onPressedChange }: ToggleChipProps) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={() => onPressedChange(!pressed)}
      className={cn(
        // 36px pill, ::after extends the hit area to 44px
        "relative inline-flex h-9 items-center gap-1 rounded-full border px-3.5 text-sm transition-colors outline-none after:absolute after:-inset-y-1 after:inset-x-0 after:content-[''] focus-visible:ring-3 focus-visible:ring-ring/50",
        pressed
          ? 'border-muted-foreground bg-secondary font-semibold text-secondary-foreground'
          : 'border-muted-foreground bg-background font-medium text-foreground hover:bg-muted',
      )}
    >
      {pressed && <Check className="size-4" strokeWidth={3} aria-hidden="true" />}
      {label}
    </button>
  )
}
