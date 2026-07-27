import { useState } from 'react'
import { Icon } from '../../../shared/components/Icon'
import type { WatchRating } from '../types/watchlistItem'
import { nextRating, RATING_VALUES } from '../utils/ratings'
import './StarRating.css'

interface StarRatingProps {
  value: WatchRating
  /** Only for the accessible labels — which symbol's rating this row edits. */
  symbol: string
  onChange: (rating: WatchRating) => void
}

/** Inline 1–5 star editor. Clicking the star you're already on clears the rating,
 * so an item can go back to unrated without a separate control. */
export function StarRating({ value, symbol, onChange }: StarRatingProps) {
  const [hovered, setHovered] = useState(0)
  const shown = hovered || value

  return (
    <span
      className="star-rating"
      role="radiogroup"
      aria-label={`Rating for ${symbol}`}
      onMouseLeave={() => setHovered(0)}
    >
      {RATING_VALUES.map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
          title={value === n ? 'Clear rating' : `Rate ${n} star${n > 1 ? 's' : ''}`}
          className={`star-rating__star${n <= shown ? ' is-on' : ''}`}
          onClick={() => onChange(nextRating(value, n))}
          onMouseEnter={() => setHovered(n)}
        >
          <Icon name="star" size={19} className="star-rating__glyph" />
        </button>
      ))}
    </span>
  )
}
