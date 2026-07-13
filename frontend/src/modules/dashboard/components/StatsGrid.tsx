import {
  formatDuration,
  formatPercent,
  formatSignedCurrency,
  formatSignedPercent,
} from '../../../shared/utils/format'
import type { DashboardSummary } from '../../trades'
import { StatTile } from '../../../shared/components/StatTile'
import { WinLossBar } from './WinLossBar'
import './StatsGrid.css'

interface StatsGridProps {
  summary: DashboardSummary
}

/** The KPI row. Win rate is the gradient hero; the rest supplement it. */
export function StatsGrid({ summary }: StatsGridProps) {
  const pnlTone = summary.netPnl > 0 ? 'good' : summary.netPnl < 0 ? 'critical' : 'default'
  const returnTone =
    summary.avgReturnPercent > 0 ? 'good' : summary.avgReturnPercent < 0 ? 'critical' : 'default'

  return (
    <div className="stats-grid">
      <StatTile label="Win rate" value={formatPercent(summary.winRate, 0)} icon="target" hero>
        <WinLossBar wins={summary.wins} losses={summary.losses} onHero />
      </StatTile>

      <StatTile
        label="Net P&L"
        value={formatSignedCurrency(summary.netPnl)}
        icon="dollar"
        tone={pnlTone}
        sub={`across ${summary.closedTrades} closed`}
      />

      <StatTile
        label="Total trades"
        value={String(summary.totalTrades)}
        icon="layers"
        tone="violet"
        sub={`${summary.wins} won · ${summary.losses} lost`}
      />

      <StatTile
        label="Avg return"
        value={formatSignedPercent(summary.avgReturnPercent)}
        icon="trending"
        tone={returnTone}
        sub="per trade"
      />

      <StatTile
        label="Avg hold time"
        value={formatDuration(summary.avgDurationMs)}
        icon="clock"
        tone="amber"
        sub="entry to exit"
      />
    </div>
  )
}
