import { HoverCard } from '../../../shared/components/HoverCard'
import { Icon } from '../../../shared/components/Icon'
import { RatingStars } from '../../../shared/components/RatingStars'
import { formatPercent, formatSignedPercent } from '../../../shared/utils/format'
import { CODE33_STARS, code33Verdict, formatPeriodLabel, type Code33Rating } from '../../fundamentals'
import './Code33Summary.css'

interface Code33SummaryProps {
  rating: Code33Rating
}

/** Compact Code 33 readout for the title row — stars + score. The grid itself (colour-coded
 * per cell) is the primary "why"; this hover-card is the detail behind it, same pattern as
 * `TradeRatingBadge` — collapsed by default, the growth figures behind every check are one
 * hover away rather than permanently taking up page space. */
export function Code33Summary({ rating }: Code33SummaryProps) {
  const verdict = code33Verdict(rating)
  const stars = rating.stars.toFixed(1)

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
        <div className="code33-details__heading">
          Code 33
          <span className={`code33-details__verdict is-${verdict.tone}`}>{verdict.label}</span>
        </div>

        {rating.steps.length === 0 ? (
          <p className="code33-details__empty">{verdict.label}</p>
        ) : (
          <ul className="code33-details__steps">
            {rating.steps.map((step) => (
              <li key={`${step.fromPeriod}-${step.toPeriod}`} className="code33-details__step">
                <span className="code33-details__step-period">
                  {formatPeriodLabel(step.fromPeriod)} → {formatPeriodLabel(step.toPeriod)}
                </span>
                <span className={`code33-details__check${step.epsAccelerated ? ' is-met' : ''}`}>
                  <Icon name={step.epsAccelerated ? 'check' : 'x'} size={12} />
                  EPS {formatSignedPercent(step.epsGrowthFrom)} → {formatSignedPercent(step.epsGrowthTo)}
                </span>
                <span className={`code33-details__check${step.salesAccelerated ? ' is-met' : ''}`}>
                  <Icon name={step.salesAccelerated ? 'check' : 'x'} size={12} />
                  Sales {formatSignedPercent(step.salesGrowthFrom)} → {formatSignedPercent(step.salesGrowthTo)}
                </span>
                <span className={`code33-details__check${step.marginExpanded ? ' is-met' : ''}`}>
                  <Icon name={step.marginExpanded ? 'check' : 'x'} size={12} />
                  Margin {formatPercent(step.marginFrom)} → {formatPercent(step.marginTo)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </HoverCard>
  )
}
