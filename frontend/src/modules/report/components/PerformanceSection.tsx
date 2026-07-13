import { StatTile } from '../../../shared/components/StatTile'
import {
  formatDuration,
  formatPercent,
  formatSignedCurrency,
} from '../../../shared/utils/format'
import type { PerformanceStats } from '../types/report'
import './PerformanceSection.css'

interface PerformanceSectionProps {
  stats: PerformanceStats
}

/** What a genuinely undefined figure reads as — never "0", never "NaN". */
const NOT_YET = '—'

function formatR(value: number | null): string {
  if (value === null) return NOT_YET
  const sign = value > 0 ? '+' : value < 0 ? '−' : ''
  return `${sign}${Math.abs(value).toFixed(2)}R`
}

function formatRatio(value: number | null): string {
  return value === null ? NOT_YET : value.toFixed(2)
}

function formatHold(ms: number | null): string {
  return ms === null ? NOT_YET : formatDuration(ms)
}

/** The money half: what the trading actually returned. */
export function PerformanceSection({ stats }: PerformanceSectionProps) {
  const noWinners = stats.wins === 0

  return (
    <div className="perf">
      <StatTile
        label="Net P&L"
        value={formatSignedCurrency(stats.netPnl)}
        icon="dollar"
        tone={stats.netPnl >= 0 ? 'good' : 'critical'}
        sub={`${stats.closedCount} closed trade${stats.closedCount === 1 ? '' : 's'}`}
      />

      <StatTile
        label="Win rate"
        value={formatPercent(stats.winRate, 0)}
        icon="target"
        sub={`${stats.wins} won · ${stats.losses} lost`}
      />

      <StatTile
        label="Expectancy"
        value={formatR(stats.expectancyR)}
        icon="trending"
        tone={stats.expectancyR !== null && stats.expectancyR >= 0 ? 'good' : 'critical'}
        sub="Average return per unit of risk"
      />

      <StatTile
        label="Profit factor"
        value={formatRatio(stats.profitFactor)}
        icon="layers"
        sub={noWinners ? 'Undefined until a trade wins' : 'Gross profit ÷ gross loss'}
      />

      <StatTile
        label="Payoff ratio"
        value={formatRatio(stats.payoffRatio)}
        icon="bars"
        sub={noWinners ? 'Undefined until a trade wins' : 'Average win ÷ average loss'}
      />

      <StatTile
        label="Max drawdown"
        value={formatSignedCurrency(-stats.maxDrawdown)}
        icon="arrowDownRight"
        tone={stats.maxDrawdown > 0 ? 'critical' : 'default'}
        sub="Deepest peak-to-trough fall"
      />

      <StatTile
        label="Avg hold — winners"
        value={formatHold(stats.avgHoldWinnersMs)}
        icon="clock"
        sub={noWinners ? 'No winners yet' : 'Let them run'}
      />

      <StatTile
        label="Avg hold — losers"
        value={formatHold(stats.avgHoldLosersMs)}
        icon="clock"
        tone="amber"
        sub="Cut them fast"
      />
    </div>
  )
}
