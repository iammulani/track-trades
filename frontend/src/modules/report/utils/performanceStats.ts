import { ratingVerdict } from '../../place-trade'
import type { PerformanceStats, ReportTrade } from '../types/report'
import { sortByExitAsc } from './reportTrades'

/** A trade that gave back more than the risk it planned — the stop leaked. */
export const STOP_LEAK_R = -1

function mean(values: number[]): number | null {
  if (values.length === 0) return null
  return values.reduce((sum, v) => sum + v, 0) / values.length
}

/**
 * The performance half of the report.
 *
 * Every figure that is genuinely undefined at a given sample comes back `null` rather than
 * `NaN` or `Infinity` — profit factor with no winners is not "0", it's "not yet answerable",
 * and the UI has to be able to tell those apart to render an honest "—".
 */
export function buildPerformanceStats(reportTrades: ReportTrade[]): PerformanceStats {
  const pnls = reportTrades.map((t) => t.trade.metrics.pnl ?? 0)
  const netPnl = pnls.reduce((sum, p) => sum + p, 0)

  const winners = reportTrades.filter((t) => t.trade.metrics.outcome === 'win')
  const losers = reportTrades.filter((t) => t.trade.metrics.outcome === 'loss')

  const grossProfit = winners.reduce((sum, t) => sum + (t.trade.metrics.pnl ?? 0), 0)
  const grossLoss = Math.abs(losers.reduce((sum, t) => sum + (t.trade.metrics.pnl ?? 0), 0))

  const avgWin = mean(winners.map((t) => t.trade.metrics.pnl ?? 0))
  const avgLoss = mean(losers.map((t) => Math.abs(t.trade.metrics.pnl ?? 0)))

  const rMultiples = reportTrades
    .map((t) => t.rMultiple)
    .filter((r): r is number => r !== null)

  const rated = reportTrades.filter((t) => t.ratingRatio !== null)

  return {
    closedCount: reportTrades.length,
    netPnl,
    wins: winners.length,
    losses: losers.length,
    winRate: reportTrades.length === 0 ? 0 : (winners.length / reportTrades.length) * 100,

    expectancyR: mean(rMultiples),

    // Both of these divide by the winners' side of the ledger. With no winners the quotient
    // isn't small, it's meaningless — say so rather than printing a 0 that reads like a score.
    profitFactor: winners.length === 0 || grossLoss === 0 ? null : grossProfit / grossLoss,
    payoffRatio: avgWin === null || avgLoss === null || avgLoss === 0 ? null : avgWin / avgLoss,

    maxDrawdown: computeMaxDrawdown(reportTrades),

    avgHoldWinnersMs: mean(winners.map((t) => t.trade.metrics.durationMs)),
    avgHoldLosersMs: mean(losers.map((t) => t.trade.metrics.durationMs)),

    // The discipline numbers: how often the rating said "don't trade" and the trade
    // happened anyway, and how often the loss ran past the planned risk.
    tradedAgainstRating: rated.filter(
      (t) => ratingVerdict(t.ratingRatio as number).tone === 'bad',
    ).length,
    ratedCount: rated.length,
    stopLeaks: rMultiples.filter((r) => r < STOP_LEAK_R).length,
  }
}

/** Largest peak-to-trough fall in cumulative P&L, walked in exit order. Returned as a
 * positive magnitude; 0 when the curve never gives anything back. */
function computeMaxDrawdown(reportTrades: ReportTrade[]): number {
  let cumulative = 0
  let peak = 0
  let maxDrawdown = 0

  for (const { trade } of sortByExitAsc(reportTrades)) {
    cumulative += trade.metrics.pnl ?? 0
    peak = Math.max(peak, cumulative)
    maxDrawdown = Math.max(maxDrawdown, peak - cumulative)
  }

  return maxDrawdown
}
