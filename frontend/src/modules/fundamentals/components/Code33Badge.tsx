import { Link } from 'react-router-dom'
import { Icon } from '../../../shared/components/Icon'
import type { FundamentalsRecord } from '../types/fundamentals'
import { code33Verdict, computeCode33 } from '../utils/code33'
import './Code33Badge.css'

interface Code33BadgeProps {
  watchlistItemId: string
  symbol: string
  /** The item's fundamentals record, or undefined if Verify Fundamental was never opened. */
  record: FundamentalsRecord | undefined
}

/** The watchlist row's compact Code 33 indicator — just an icon, coloured by whether
 * fundamentals have been captured yet (not by what they read — the star rating and verdict
 * live on the Verify Fundamental page this always links through to). */
export function Code33Badge({ watchlistItemId, symbol, record }: Code33BadgeProps) {
  const href = `/watchlist/${watchlistItemId}/verify-fundamental`
  const captured = !!record && record.quarters.length > 0

  const title = captured ? code33Verdict(computeCode33(record.quarters)).label : 'Verify fundamentals'
  const ariaLabel = captured
    ? `Code 33 for ${symbol}: ${title}`
    : `Verify fundamentals for ${symbol}`

  return (
    <Link
      to={href}
      className={`code33-badge${captured ? ' code33-badge--captured' : ' code33-badge--empty'}`}
      aria-label={ariaLabel}
      title={title}
    >
      <Icon name="bars" size={15} />
    </Link>
  )
}
