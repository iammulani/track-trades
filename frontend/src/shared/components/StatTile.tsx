import type { ReactNode } from 'react'
import { Card } from './Card'
import { Icon, type IconName } from './Icon'
import './StatTile.css'

type Tone = 'default' | 'good' | 'critical' | 'violet' | 'amber'

interface StatTileProps {
  label: string
  value: string
  icon: IconName
  tone?: Tone
  /** Gradient accent card with light text — used for the leading KPI. */
  hero?: boolean
  sub?: string
  /** Optional slot below the value (e.g. a proportion bar). */
  children?: ReactNode
}

/** One KPI tile: icon chip · label · value · optional sub or visual. */
export function StatTile({
  label,
  value,
  icon,
  tone = 'default',
  hero = false,
  sub,
  children,
}: StatTileProps) {
  return (
    <Card className={`stat stat--${tone}${hero ? ' stat--hero' : ''}`}>
      <div className="stat__top">
        <span className={`stat__chip stat__chip--${tone}`}>
          <Icon name={icon} size={18} />
        </span>
        <span className="stat__label">{label}</span>
      </div>
      <span className="stat__value">{value}</span>
      {sub && <span className="stat__sub">{sub}</span>}
      {children && <div className="stat__extra">{children}</div>}
    </Card>
  )
}
