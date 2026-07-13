import { computeExitPreview, type TradeWithMetrics } from '../../trades'
import type { ReportTrade } from '../types/report'

/**
 * The report's input set: every **closed** trade, each carrying its realized R-multiple
 * and the setup score it was given at placement.
 *
 * R is not recomputed here — `computeExitPreview` already derives it (as
 * `riskRewardRatio`) for the exit form's live preview, and feeding it the stored exit
 * price gives the realized figure. One definition of R, used in both places.
 */
export function buildReportTrades(trades: TradeWithMetrics[]): ReportTrade[] {
  return trades
    .filter((t) => t.metrics.status === 'closed' && t.exitPrice !== null)
    .map((trade) => ({
      trade,
      rMultiple: computeExitPreview(
        trade,
        String(trade.exitPrice),
        trade.setup?.stopLoss ?? null,
      ).riskRewardRatio,
      ratingRatio: trade.setup?.rating?.ratio ?? null,
    }))
}

/** Oldest first — the order the charts plot trades in, so time reads left to right. */
export function sortByExitAsc(reportTrades: ReportTrade[]): ReportTrade[] {
  return [...reportTrades].sort(
    (a, b) =>
      new Date(a.trade.exitTime as string).getTime() -
      new Date(b.trade.exitTime as string).getTime(),
  )
}
