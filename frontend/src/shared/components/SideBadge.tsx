import './SideBadge.css'

interface SideBadgeProps {
  side: 'long' | 'short'
}

/** Long/short pill — used by the trades table and the watchlist table alike. */
export function SideBadge({ side }: SideBadgeProps) {
  return <span className={`side-badge side-badge--${side}`}>{side}</span>
}
