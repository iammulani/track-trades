import { HoverCard } from '../../../shared/components/HoverCard'
import { RatingStars } from '../../../shared/components/RatingStars'
import { CODE33_STARS, code33Verdict, metricTone, type Code33Score } from '../../fundamentals'
import './Code33Summary.css'

interface Code33SummaryProps {
  rating: Code33Score
}

/** Compact Code 33 readout for the title row — stars + score. The grid itself (colour-coded
 * per cell) carries the per-quarter "why" now, so the hover here just explains the *score*:
 * what was checked overall, and — since a bare total reads the same whether every metric
 * contributed evenly or one metric carried the whole thing alone — the per-metric split
 * underneath it, each row toned the same way the overall verdict is. Every figure here is read
 * straight off `Code33Score`'s counts, not prose, so it can't drift or vary between renders. */
export function Code33Summary({ rating }: Code33SummaryProps) {
  const verdict = code33Verdict(rating)
  const stars = rating.stars.toFixed(1)
  const stepCount = rating.totalChecks / 3

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
      <div className="code33-details">
        <span className={`code33-details__verdict-pill is-${verdict.tone}`}>{verdict.label}</span>

        {rating.status !== 'pending' && (
          <>
            <p className="code33-details__note">
              Checked whether EPS, Sales, and Margin each improved quarter-over-quarter across{' '}
              {stepCount} quarter{stepCount === 1 ? '' : 's'} ({rating.totalChecks} checks) —{' '}
              {rating.hits} passed.
            </p>

            <div className="code33-details__breakdown">
              {(
                [
                  ['EPS', rating.epsHits],
                  ['Sales', rating.salesHits],
                  ['Margin', rating.marginHits],
                ] as const
              ).map(([label, hits]) => (
                <div key={label} className="code33-details__row">
                  <span className="code33-details__row-label">{label}</span>
                  <span className={`code33-details__row-count is-${metricTone(hits, stepCount)}`}>
                    {hits}/{stepCount}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </HoverCard>
  )
}
