import type { CSSProperties } from 'react'
import { Icon } from '../../../shared/components/Icon'
import { RATING_STARS } from '../utils/tradeRating'
import './RatingStars.css'

interface RatingStarsProps {
  /** 0..1 — the share of the row to fill. */
  ratio: number
  size?: number
}

/** A row of outline stars with an identical filled row clipped to the score — smooth partial
 * fill without needing a half-star glyph. Shared by the stepper badge, the Review banner and
 * the Trade Detail page so the three can't drift apart on star count or styling. */
export function RatingStars({ ratio, size = 15 }: RatingStarsProps) {
  const stars = Array.from({ length: RATING_STARS }, (_, i) => (
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
