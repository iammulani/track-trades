import type { CSSProperties } from 'react'
import { Icon } from './Icon'
import './RatingStars.css'

interface RatingStarsProps {
  /** 0..1 — the share of the row to fill. */
  ratio: number
  /** How many star glyphs to render. */
  count?: number
  size?: number
}

/** A row of outline stars with an identical filled row clipped to the score — smooth partial
 * fill without needing a half-star glyph. Shared by every star rating in the app (trade rating,
 * Code 33) so they can't drift apart on styling. */
export function RatingStars({ ratio, count = 5, size = 15 }: RatingStarsProps) {
  const stars = Array.from({ length: count }, (_, i) => (
    <Icon key={i} name="star" size={size} className="rating-stars__star" />
  ))
  return (
    <span className="rating-stars" style={{ '--fill': `${ratio * 100}%` } as CSSProperties}>
      <span className="rating-stars__track">{stars}</span>
      <span className="rating-stars__fill" aria-hidden="true">
        {stars}
      </span>
    </span>
  )
}
