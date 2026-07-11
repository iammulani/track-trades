import { Icon } from './Icon'
import './SideBadge.css'

interface SideBadgeProps {
  side: 'long' | 'short'
}

/** Long/short pill — an arrow icon so the direction reads at a glance, not just from the label. */
export function SideBadge({ side }: SideBadgeProps) {
  return (
    <span className={`side-badge side-badge--${side}`}>
      <Icon name={side === 'long' ? 'arrowUpRight' : 'arrowDownRight'} size={12} />
      {side}
    </span>
  )
}
