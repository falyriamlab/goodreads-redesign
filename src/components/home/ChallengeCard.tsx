import { useId } from 'react'
import { Link } from 'react-router'
import { getChallengePace, getChallengeProgress } from '@/lib/challenge'
import { useLibrary } from '@/state/library'

const linkClass =
  'inline-flex min-h-11 min-w-11 items-center justify-center text-sm font-semibold underline underline-offset-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/50'

export function ChallengeCard() {
  const headingId = useId()
  const entries = useLibrary((s) => s.entries)
  const progress = getChallengeProgress(entries)
  const pace = getChallengePace(progress)
  const percent = Math.min(100, Math.round((progress.read / progress.goal) * 100))

  return (
    <section aria-labelledby={headingId} className="mx-4 space-y-3 rounded-xl border border-border bg-card p-4 text-card-foreground">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id={headingId} className="font-bold tracking-tight">
            {progress.year} Reading Challenge
          </h2>
          <p className="text-2xl font-bold tracking-tight">
            {progress.read} <span className="text-base font-medium text-muted-foreground">of {progress.goal} books</span>
          </p>
        </div>
        {pace.goalMet ? (
          <Link to="/profile" className={linkClass}>
            Raise your goal
          </Link>
        ) : (
          <Link to="/profile" className={linkClass}>
            View<span className="sr-only"> reading challenge</span>
          </Link>
        )}
      </div>
      <div
        role="progressbar"
        aria-labelledby={headingId}
        aria-valuemin={0}
        aria-valuemax={progress.goal}
        aria-valuenow={Math.min(progress.read, progress.goal)}
        aria-valuetext={`${progress.read} of ${progress.goal} books`}
        className="h-2.5 overflow-hidden rounded-full bg-muted"
      >
        <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
      </div>
      <p className="text-sm text-muted-foreground">{pace.message}</p>
    </section>
  )
}
