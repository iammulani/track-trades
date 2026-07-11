import type { ReactNode } from 'react'
import { Card } from '../../../shared/components/Card'
import './StatTile.css'

type Tone = 'default' | 'good' | 'critical'

interface StatTileProps {
  label: string
  value: string
  tone?: Tone
  /** Optional emphasised hero value (larger). Used for the leading KPI. */
  hero?: boolean
  /** Optional sub-line under the value (e.g. "7 won · 5 lost"). */
  sub?: string
  /** Optional slot below the value (e.g. a proportion bar). */
  children?: ReactNode
}

/** One KPI tile: label · value · optional sub · optional visual. */
export function StatTile({
  label,
  value,
  tone = 'default',
  hero = false,
  sub,
  children,
}: StatTileProps) {
  return (
    <Card className="stat">
      <span className="stat__label">{label}</span>
      <span className={`stat__value stat__value--${tone}${hero ? ' stat__value--hero' : ''}`}>
        {value}
      </span>
      {sub && <span className="stat__sub">{sub}</span>}
      {children && <div className="stat__extra">{children}</div>}
    </Card>
  )
}
