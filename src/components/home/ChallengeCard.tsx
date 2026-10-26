import { useId } from 'react'
import { Link } from 'react-router'
import { ProgressBar } from '@/components/common/ProgressBar'
import type { ChallengePace, ChallengeProgress } from '@/lib/challenge'

type Props = { challenge: ChallengeProgress; pace: ChallengePace; percent: number; to?: string }

/**
 * Marginalia rule 2: the challenge lives on the brand band (bg-primary + text-primary-foreground, 4.69:1).
 * Big text is ≥ 24px; the small lines (kicker, pace, link) still pass 4.5:1. Used on Home and Profile.
 */
export function ChallengeCard({ challenge, pace, percent, to = '/profile/stats' }: Props) {
  const id = useId()
  return (
    <section aria-labelledby={id} className="space-y-4 bg-primary px-4 py-8 text-primary-foreground">
      <div className="flex items-start justify-between gap-3">
        <h2 id={id} className="section-title">
          {challenge.year} reading challenge
        </h2>
        <Link
          to={to}
          className="inline-flex min-h-11 min-w-11 items-center justify-end text-sm font-semibold underline underline-offset-4 outline-none focus-visible:ring-3 focus-visible:ring-primary-foreground"
        >
          See all<span className="sr-only"> reading stats</span>
        </Link>
      </div>
      {/* Display number */}
      <p className="flex items-baseline gap-3">
        <span className="display-xl">{challenge.read}</span>
        <span className="font-serif text-2xl">of {challenge.goal} books</span>
      </p>
      <ProgressBar tone="brand" percent={percent} labelledBy={id} valueText={`${challenge.read} of ${challenge.goal} books`} />
      <p className="text-base font-medium">{pace.message}</p>
    </section>
  )
}
