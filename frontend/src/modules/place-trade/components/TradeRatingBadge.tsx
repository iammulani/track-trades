import type { CSSProperties } from 'react'
import { HoverCard } from '../../../shared/components/HoverCard'
import { Icon, type IconName } from '../../../shared/components/Icon'
import type { RatingCriterion, TradeRating } from '../utils/tradeRating'
import './TradeRatingBadge.css'

interface TradeRatingBadgeProps {
  rating: TradeRating
  size?: number
}

const STAR_COUNT = 7

/** full / partial / miss, from a criterion's 0..1 score. */
function criterionState(c: RatingCriterion): { className: string; icon: IconName } {
  if (c.score >= 1) return { className: 'is-met', icon: 'check' }
  if (c.score > 0) return { className: 'is-partial', icon: 'alert' }
  return { className: 'is-unmet', icon: 'x' }
}

/** A row of outline stars with an identical filled row clipped to the score — smooth
 * partial fill without needing a half-star glyph. */
function Stars({ ratio, size }: { ratio: number; size: number }) {
  const stars = Array.from({ length: STAR_COUNT }, (_, i) => (
    <Icon key={i} name="star" size={size} className="trade-rating-badge__star" />
  ))
  return (
    <span
      className="trade-rating-badge__stars"
      style={{ '--fill': `${ratio * 100}%` } as CSSProperties}
    >
      <span className="trade-rating-badge__stars-track">{stars}</span>
      <span className="trade-rating-badge__stars-fill" aria-hidden="true">
        {stars}
      </span>
    </span>
  )
}

export function TradeRatingBadge({ rating, size = 15 }: TradeRatingBadgeProps) {
  const percent = Math.round(rating.ratio * 100)
  return (
    <HoverCard
      label={`Trade rating: ${percent}%`}
      triggerClassName="hover-card__trigger--plain"
      trigger={
        <span className="trade-rating-badge">
          <Stars ratio={rating.ratio} size={size} />
          <span className="trade-rating-badge__count">{percent}%</span>
        </span>
      }
    >
      <div className="trade-rating-details">
        <div className="trade-rating-details__heading">
          Trade Rating
          <span className="trade-rating-details__score">{percent}%</span>
        </div>
        <ul>
          {rating.criteria.map((c) => {
            const { className, icon } = criterionState(c)
            return (
              <li key={c.id} className={className}>
                <Icon name={icon} size={13} />
                {c.label}
              </li>
            )
          })}
        </ul>
      </div>
    </HoverCard>
  )
}
