import type { TradeWithMetrics } from '../types/trade'

export interface EquityPoint {
  /** Exit time (ms) of the trade that produced this cumulative value. */
  time: number
  /** Cumulative net P&L up to and including this trade. */
  cumulative: number
  /** The trade's own P&L (the step). */
  pnl: number
  symbol: string
}

/**
 * Cumulative P&L over time, built from closed trades ordered by exit time.
 * A leading zero point anchors the curve to the baseline.
 */
export function buildEquitySeries(trades: TradeWithMetrics[]): EquityPoint[] {
  const closed = trades
    .filter((t) => t.metrics.status === 'closed' && t.exitTime !== null)
    .sort(
      (a, b) => new Date(a.exitTime as string).getTime() - new Date(b.exitTime as string).getTime(),
    )

  if (closed.length === 0) return []

  const first = new Date(closed[0].exitTime as string).getTime()
  const points: EquityPoint[] = [{ time: first, cumulative: 0, pnl: 0, symbol: '' }]

  let running = 0
  for (const t of closed) {
    running += t.metrics.pnl ?? 0
    points.push({
      time: new Date(t.exitTime as string).getTime(),
      cumulative: running,
      pnl: t.metrics.pnl ?? 0,
      symbol: t.symbol,
    })
  }

  return points
}
