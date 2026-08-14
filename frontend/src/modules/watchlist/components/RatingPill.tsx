import { Icon } from '../../../shared/components/Icon'
import type { WatchRating } from '../types/watchlistItem'
import { cycleRating } from '../utils/ratings'
import './RatingPill.css'

interface RatingPillProps {
  value: WatchRating
  /** Only for the accessible label — which symbol's rating this row edits. */
  symbol: string
  onChange: (rating: WatchRating) => void
}

/** Compact rating control — a single star with the number on top, not five stars or a bare
 * ring. One click steps the rating forward (unrated → 1 → 2 → 3 → 4 → 5 → back to unrated),
 * trading "click star N to set N directly" for a column that's a fraction of the width. */
export function RatingPill({ value, symbol, onChange }: RatingPillProps) {
  const rated = value > 0

  return (
    <button
      type="button"
      className={`rating-pill${rated ? ' is-rated' : ''}`}
      onClick={() => onChange(cycleRating(value))}
      aria-label={`Rating for ${symbol}: ${rated ? `${value} star${value > 1 ? 's' : ''}` : 'unrated'}`}
      title={rated ? `${value} star${value > 1 ? 's' : ''} — click to change` : 'Unrated — click to rate'}
    >
      <Icon name="star" size={38} className="rating-pill__star" />
      {rated && <span className="rating-pill__value">{value}</span>}
    </button>
  )
}
