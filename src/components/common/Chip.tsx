import type { VariantProps } from 'class-variance-authority'
import { Check } from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { chipVariants } from './chipVariants'

type ChipProps = ComponentProps<'button'> &
  VariantProps<typeof chipVariants> & {
    /** Leading icon. Left out, a selected chip gets the check; null means no leading icon */
    icon?: ReactNode
  }

/** The chip as a button (rules in chipVariants). Links and menu triggers use chipVariants directly */
export function Chip({ variant, selected, icon, className, children, ...props }: ChipProps) {
  const leading = icon !== undefined ? icon : selected && <Check className="size-4" strokeWidth={3} aria-hidden="true" />
  return (
    <button type="button" data-slot="chip" className={cn(chipVariants({ variant, selected }), className)} {...props}>
      {leading}
      {children}
    </button>
  )
}
