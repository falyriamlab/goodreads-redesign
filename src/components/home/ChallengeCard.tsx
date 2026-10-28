import { useId } from 'react'
import { Link } from 'react-router'
import { ProgressBar } from '@/components/common/ProgressBar'
import type { ChallengePace, ChallengeProgress } from '@/lib/challenge'
import { seeMoreClass } from '@/lib/ui'

type Props = { challenge: ChallengeProgress; pace: ChallengePace; percent: number; to?: string }

/**
 * Rule 2: the reading challenge is a card (Home and Profile), not a full-width band. Neutral on purpose:
 * the count is a stat number, and the bar is ink on the track (the one progress bar that isn't --primary).
 * The link is "See stats" (copy rule: See + destination); once the goal is met it becomes "Raise your goal".
 */
export function ChallengeCard({ challenge, pace, percent, to = '/profile/stats' }: Props) {
  const id = useId()
  const valueText = `${challenge.read} of ${challenge.goal} books`
  return (
    <section aria-labelledby={id} className="mx-4 space-y-4 rounded-lg border border-border bg-card p-5 text-card-foreground">
      <div className="flex items-center justify-between gap-3">
        <h2 id={id} className="section-title">
          {challenge.year} reading challenge
        </h2>
        <Link to={to} className={seeMoreClass}>
          {pace.goalMet ? 'Raise your goal' : 'See stats'}
        </Link>
      </div>
      <p className="flex items-baseline gap-2">
        <span className="stat-number">{challenge.read}</span>
        <span className="stat-unit text-muted-foreground">of {challenge.goal} books</span>
      </p>
      <ProgressBar tone="ink" percent={percent} labelledBy={id} valueText={valueText} />
      <p className="text-sm text-muted-foreground">{pace.message}</p>
    </section>
  )
}
