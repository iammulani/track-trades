import { HoverCard } from '../../../shared/components/HoverCard'
import { Icon } from '../../../shared/components/Icon'
import {
  CRITERION_STATE_ICON,
  criterionState,
  formatStars,
  GATE_STATE_ICON,
  RATING_STARS,
  type TradeRating,
} from '../utils/tradeRating'
import { RatingStars } from './RatingStars'
import './TradeRatingBadge.css'

interface TradeRatingBadgeProps {
  rating: TradeRating
  size?: number
}

export function TradeRatingBadge({ rating, size = 15 }: TradeRatingBadgeProps) {
  const percent = Math.round(rating.ratio * 100)
  const stars = formatStars(rating.stars)
  return (
    <HoverCard
      label={`Trade rating: ${stars} out of ${RATING_STARS} stars`}
      triggerClassName="hover-card__trigger--plain"
      trigger={
        <span className="trade-rating-badge">
          <RatingStars ratio={rating.ratio} size={size} />
          <span className="trade-rating-badge__count">
            {stars} / {RATING_STARS} · {percent}%
          </span>
        </span>
      }
    >
      <div className="trade-rating-details">
        <div className="trade-rating-details__heading">
          Trade Rating
          <span className="trade-rating-details__score">
            {stars} / {RATING_STARS}
          </span>
        </div>

        <div className="trade-rating-details__group">Non-negotiables</div>
        <ul>
          {rating.gates.map((g) => (
            <li key={g.id} className={`is-gate-${g.state}`}>
              <Icon name={GATE_STATE_ICON[g.state]} size={13} />
              {g.label}
            </li>
          ))}
        </ul>

        <div className="trade-rating-details__group">Scored criteria</div>
        <ul>
          {rating.criteria.map((c) => {
            const state = criterionState(c)
            return (
              <li key={c.id} className={`is-${state}`}>
                <Icon name={CRITERION_STATE_ICON[state]} size={13} />
                {c.label}
              </li>
            )
          })}
        </ul>
      </div>
    </HoverCard>
  )
}
