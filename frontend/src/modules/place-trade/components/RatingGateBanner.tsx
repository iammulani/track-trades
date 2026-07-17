import { Icon } from '../../../shared/components/Icon'
import { bindingGates, formatStars, RATING_STARS, type TradeRating } from '../utils/tradeRating'
import './RatingGateBanner.css'

interface RatingGateBannerProps {
  rating: TradeRating
}

/** The broken non-negotiables that are holding the score down. A failed gate is the most
 * important thing on the page — it can't hide in a hover-card — so it's called out above the
 * points breakdown, with the ceiling it imposes. Renders nothing when every gate passes.
 * Shared by the Review step and the read-only Trade Detail page. */
export function RatingGateBanner({ rating }: RatingGateBannerProps) {
  const failed = bindingGates(rating)
  if (failed.length === 0) return null

  const whatFailed =
    failed.length === 1 ? `"${failed[0].name}" isn't met` : `${failed.length} non-negotiables aren't met`

  return (
    <div className="rating-gate-banner">
      <div className="rating-gate-banner__heading">
        <Icon name="alert" size={16} />
        Capped at {formatStars(rating.ratio * RATING_STARS)} / {RATING_STARS} — {whatFailed}, and
        that always limits the score, however well everything else did (
        {Math.round(rating.rawRatio * 100)}%).
      </div>
      <ul className="rating-gate-banner__list">
        {failed.map((gate) => (
          <li key={gate.id}>
            <span className="rating-gate-banner__label">
              <span className="rating-gate-banner__name">{gate.name}</span>
              <span className="rating-gate-banner__badge">Not met</span>
              <span className="rating-gate-banner__cap">
                caps at {formatStars(gate.cap * RATING_STARS)}★
              </span>
            </span>
            {gate.detail ? (
              <span className="rating-gate-banner__reason">{gate.detail}</span>
            ) : (
              <>
                <span className="rating-gate-banner__description">Needs: {gate.description}</span>
                <span className="rating-gate-banner__reason">{gate.reason}</span>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
