import { HoverCard } from '../../../shared/components/HoverCard'
import { Icon } from '../../../shared/components/Icon'
import type { TradeRating } from '../utils/tradeRating'
import './TradeRatingBadge.css'

interface TradeRatingBadgeProps {
  rating: TradeRating
  size?: number
}

export function TradeRatingBadge({ rating, size = 15 }: TradeRatingBadgeProps) {
  return (
    <HoverCard
      label={`Trade rating: ${rating.earned} of ${rating.total} stars`}
      triggerClassName="hover-card__trigger--plain"
      trigger={
        <span className="trade-rating-badge">
          <span className="trade-rating-badge__stars">
            {Array.from({ length: rating.total }, (_, i) => (
              <Icon
                key={i}
                name="star"
                size={size}
                className={`trade-rating-badge__star${i < rating.earned ? ' is-filled' : ''}`}
              />
            ))}
          </span>
          <span className="trade-rating-badge__count">
            {rating.earned}/{rating.total}
          </span>
        </span>
      }
    >
      <div className="trade-rating-details">
        <div className="trade-rating-details__heading">
          Trade Rating
          <span className="trade-rating-details__score">
            {rating.earned}/{rating.total}
          </span>
        </div>
        <ul>
          {rating.criteria.map((c) => (
            <li key={c.id} className={c.met ? 'is-met' : 'is-unmet'}>
              <Icon name={c.met ? 'check' : 'x'} size={13} />
              {c.label}
            </li>
          ))}
        </ul>
      </div>
    </HoverCard>
  )
}
