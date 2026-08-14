import { HoverCard } from '../../../shared/components/HoverCard'
import { RatingStars } from '../../../shared/components/RatingStars'
import { CODE33_STARS, code33Verdict, type Code33Rating } from '../../fundamentals'
import './Code33Summary.css'

interface Code33SummaryProps {
  rating: Code33Rating
}

/** Compact Code 33 readout for the title row — stars + score. The grid itself (colour-coded
 * per cell) carries the per-quarter "why" now, so the hover here explains the *score*: what was
 * checked, and the per-metric tally it came from — "EPS 1/3 · Sales 2/3 · Margin 1/3" — so it's
 * visible which cylinder is actually carrying (or dragging down) the number, not just the total.
 * Every figure here is read straight off `Code33Rating`'s counts, not prose, so it can't drift
 * or vary between renders. */
export function Code33Summary({ rating }: Code33SummaryProps) {
  const verdict = code33Verdict(rating)
  const stars = rating.stars.toFixed(1)
  const stepCount = rating.steps.length

  return (
    <HoverCard
      label={`Code 33 rating: ${stars} out of ${CODE33_STARS} stars`}
      triggerClassName="hover-card__trigger--plain"
      trigger={
        <span className="code33-summary">
          <RatingStars ratio={rating.ratio} count={CODE33_STARS} size={18} />
          <span className="code33-summary__score">
            {stars} / {CODE33_STARS}
          </span>
        </span>
      }
    >
      <p className={`code33-verdict is-${verdict.tone}`}>{verdict.label}</p>
      {rating.status !== 'pending' && (
        <p className="code33-summary__note">
          Checked EPS, Sales, and Margin across {stepCount} quarter{stepCount === 1 ? '' : 's'} —
          EPS {rating.epsHits}/{stepCount} · Sales {rating.salesHits}/{stepCount} · Margin{' '}
          {rating.marginHits}/{stepCount} ({rating.hits} of {rating.totalChecks} passed)
        </p>
      )}
    </HoverCard>
  )
}
