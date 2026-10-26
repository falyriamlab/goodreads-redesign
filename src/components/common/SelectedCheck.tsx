import { Check } from 'lucide-react'

/**
 * The check that goes with a neutral selected state (rule 8), for Radix toggle items: shown only while
 * the item is on. The item needs `group/selected` (part of each file's toggleOnClass).
 */
export function SelectedCheck() {
  return <Check className="hidden size-3.5 shrink-0 group-data-[state=on]/selected:block" strokeWidth={3} aria-hidden="true" />
}
