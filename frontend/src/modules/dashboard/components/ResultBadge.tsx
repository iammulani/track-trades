import type { TradeOutcome, TradeStatus } from '../types/trade'
import './ResultBadge.css'

interface ResultBadgeProps {
  outcome: TradeOutcome | null
  status: TradeStatus
}

const LABEL: Record<TradeOutcome, string> = {
  win: 'Win',
  loss: 'Loss',
  breakeven: 'Flat',
}

/** Win/loss pill. Colour is always paired with the text label (never colour alone). */
export function ResultBadge({ outcome, status }: ResultBadgeProps) {
  if (status === 'open' || outcome === null) {
    return <span className="badge badge--open">Open</span>
  }
  return <span className={`badge badge--${outcome}`}>{LABEL[outcome]}</span>
}
