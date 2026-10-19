import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Props = {
  /** "Join Romantasy Girlies": the name stays fixed, aria-pressed carries the state */
  label: string
  joined: boolean
  onToggle: () => void
  className?: string
}

/** Join / Joined toggle. Joined = outlined + check icon + different text, never color alone. */
export function JoinButton({ label, joined, onToggle, className }: Props) {
  return (
    <Button
      aria-pressed={joined}
      aria-label={label}
      variant={joined ? 'outline' : 'default'}
      className={cn('min-h-11 min-w-22', joined && 'border-foreground font-semibold', className)}
      onClick={onToggle}
    >
      {joined && <Check aria-hidden="true" />}
      <span aria-hidden="true">{joined ? 'Joined' : 'Join'}</span>
    </Button>
  )
}
