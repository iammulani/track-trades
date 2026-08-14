import { Icon } from '../../../shared/components/Icon'
import type { WatchRating } from '../types/watchlistItem'
import { cycleRating, RATING_TONES } from '../utils/ratings'
import './RatingFlame.css'

interface RatingFlameProps {
  value: WatchRating
  /** Only for the accessible label — which symbol's rating this row edits. */
  symbol: string
  onChange: (rating: WatchRating) => void
}

/** Compact rating control — a flame icon with the number beside it, not inside it (a digit
 * overlaid on an icon's uneven silhouette reads poorly at this size — that's what this
 * replaces). Colour is the primary signal: each rating 1-5 gets its own fixed cold→hot tone
 * (see `RATING_TONES`), so the exact value reads from colour alone once learned, with the
 * number there for anyone still learning it. One click steps the rating forward (unrated →
 * 1 → 2 → 3 → 4 → 5 → back to unrated). */
export function RatingFlame({ value, symbol, onChange }: RatingFlameProps) {
  const rated = value > 0
  const tone = rated ? RATING_TONES[value as Exclude<WatchRating, 0>] : undefined

  return (
    <button
      type="button"
      className={`rating-flame${rated ? ' is-rated' : ''}`}
      style={tone ? { color: tone } : undefined}
      onClick={() => onChange(cycleRating(value))}
      aria-label={`Rating for ${symbol}: ${rated ? `${value} star${value > 1 ? 's' : ''}` : 'unrated'}`}
      title={rated ? `${value} star${value > 1 ? 's' : ''} — click to change` : 'Unrated — click to rate'}
    >
      <Icon name="flame" size={18} className="rating-flame__icon" />
      <span className="rating-flame__value">{rated ? value : '–'}</span>
    </button>
  )
}
