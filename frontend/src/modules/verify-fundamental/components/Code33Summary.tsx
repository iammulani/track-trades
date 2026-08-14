import { HoverCard } from '../../../shared/components/HoverCard'
import { RatingStars } from '../../../shared/components/RatingStars'
import { CODE33_STARS, code33Verdict, type Code33Rating } from '../../fundamentals'
import './Code33Summary.css'

interface Code33SummaryProps {
  rating: Code33Rating
}

/** Compact Code 33 readout for the title row — stars + score. The grid itself (colour-coded
 * per cell) carries the "why" now, so the hover here just names the overall verdict — the
 * numeric per-step breakdown that used to live here read as clutter once the grid already
 * showed the same thing in colour. */
export function Code33Summary({ rating }: Code33SummaryProps) {
  const verdict = code33Verdict(rating)
  const stars = rating.stars.toFixed(1)

  return (
    <HoverCard
      label={`Code 33 rating: ${stars} out of ${CODE33_STARS} stars`}
      triggerClassName="hover-card__trigger--plain"
      trigger={
        <span className="code33-summary">
          <RatingStars ratio={rating.ratio} count={CODE33_STARS} size={18} />
          <span className="code33-summary__score">
            {stars} / {CODE33_STARS}
          </span>
        </span>
      }
    >
      <p className={`code33-verdict is-${verdict.tone}`}>{verdict.label}</p>
    </HoverCard>
  )
}
