import { Icon } from '../../../shared/components/Icon'
import type { WatchRating } from '../types/watchlistItem'
import { cycleRating, RATING_TONES } from '../utils/ratings'
import './RatingStar.css'

interface RatingStarProps {
  value: WatchRating
  /** Only for the accessible label — which symbol's rating this row edits. */
  symbol: string
  onChange: (rating: WatchRating) => void
}

/** Compact rating control — a star icon with the number beside it, not inside it (a digit
 * overlaid on an icon's uneven silhouette reads poorly at this size — tried that first).
 * Colour is the primary signal: each rating 1-5 gets its own fixed cold→hot tone (see
 * `RATING_TONES`), so the exact value reads from colour alone once learned, with the number
 * there for anyone still learning it. One click steps the rating forward (unrated →
 * 1 → 2 → 3 → 4 → 5 → back to unrated). */
export function RatingStar({ value, symbol, onChange }: RatingStarProps) {
  const rated = value > 0
  const tone = rated ? RATING_TONES[value as Exclude<WatchRating, 0>] : undefined

  return (
    <button
      type="button"
      className={`rating-star${rated ? ' is-rated' : ''}`}
      style={tone ? { color: tone } : undefined}
      onClick={() => onChange(cycleRating(value))}
      aria-label={`Rating for ${symbol}: ${rated ? `${value} star${value > 1 ? 's' : ''}` : 'unrated'}`}
      title={rated ? `${value} star${value > 1 ? 's' : ''} — click to change` : 'Unrated — click to rate'}
    >
      <Icon name="star" size={18} className="rating-star__icon" />
      <span className="rating-star__value">{rated ? value : '–'}</span>
    </button>
  )
}
