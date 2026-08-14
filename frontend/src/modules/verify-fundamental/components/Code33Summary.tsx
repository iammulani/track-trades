import { Icon } from '../../../shared/components/Icon'
import { RatingStars } from '../../../shared/components/RatingStars'
import { CODE33_STARS, code33Verdict, formatPeriodLabel, type Code33Rating } from '../../fundamentals'
import './Code33Summary.css'

interface Code33SummaryProps {
  rating: Code33Rating
}

/** The page's big Code 33 readout: stars + score + verdict, then a plain per-step breakdown
 * so "why this score" never has to be taken on faith. */
export function Code33Summary({ rating }: Code33SummaryProps) {
  const verdict = code33Verdict(rating)

  return (
    <div className="code33-summary">
      <div className="code33-summary__headline">
        <RatingStars ratio={rating.ratio} count={CODE33_STARS} size={22} />
        <span className="code33-summary__score">
          {rating.stars.toFixed(1)} / {CODE33_STARS}
        </span>
        <span className={`code33-summary__verdict is-${verdict.tone}`}>{verdict.label}</span>
      </div>

      {rating.steps.length > 0 && (
        <ul className="code33-summary__steps">
          {rating.steps.map((step) => (
            <li key={`${step.fromPeriod}-${step.toPeriod}`} className="code33-summary__step">
              <span className="code33-summary__step-period">
                {formatPeriodLabel(step.fromPeriod)} → {formatPeriodLabel(step.toPeriod)}
              </span>
              <span className={`code33-summary__check${step.epsAccelerated ? ' is-met' : ''}`}>
                <Icon name={step.epsAccelerated ? 'check' : 'x'} size={13} />
                EPS
              </span>
              <span className={`code33-summary__check${step.salesAccelerated ? ' is-met' : ''}`}>
                <Icon name={step.salesAccelerated ? 'check' : 'x'} size={13} />
                Sales
              </span>
              <span className={`code33-summary__check${step.marginExpanded ? ' is-met' : ''}`}>
                <Icon name={step.marginExpanded ? 'check' : 'x'} size={13} />
                Margin
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
