import { Link } from 'react-router-dom'
import { Icon } from '../../../shared/components/Icon'
import { RatingStars } from '../../../shared/components/RatingStars'
import type { FundamentalsRecord } from '../types/fundamentals'
import { CODE33_STARS, code33Verdict, computeCode33 } from '../utils/code33'
import './Code33Badge.css'

interface Code33BadgeProps {
  watchlistItemId: string
  symbol: string
  /** The item's fundamentals record, or undefined if Verify Fundamental was never opened. */
  record: FundamentalsRecord | undefined
}

/** The watchlist row's compact Code 33 indicator — a muted icon until enough consecutive
 * quarters are entered to judge, then a mini star row + score. Always links through to the
 * full breakdown on the Verify Fundamental page. */
export function Code33Badge({ watchlistItemId, symbol, record }: Code33BadgeProps) {
  const href = `/watchlist/${watchlistItemId}/verify-fundamental`

  if (!record || record.quarters.length === 0) {
    return (
      <Link
        to={href}
        className="code33-badge code33-badge--empty"
        aria-label={`Verify fundamentals for ${symbol}`}
        title="Verify fundamentals"
      >
        <Icon name="bars" size={15} />
      </Link>
    )
  }

  const rating = computeCode33(record.quarters)
  const verdict = code33Verdict(rating)

  if (rating.status === 'pending') {
    return (
      <Link
        to={href}
        className="code33-badge code33-badge--empty"
        aria-label={`Code 33 for ${symbol}: ${verdict.label}`}
        title={verdict.label}
      >
        <Icon name="bars" size={15} />
      </Link>
    )
  }

  return (
    <Link
      to={href}
      className="code33-badge"
      aria-label={`Code 33 for ${symbol}: ${verdict.label}`}
      title={verdict.label}
    >
      <RatingStars ratio={rating.ratio} count={CODE33_STARS} size={13} />
      <span className="code33-badge__count">{rating.stars.toFixed(1)}</span>
    </Link>
  )
}
