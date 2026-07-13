import { fromRatingSnapshot } from '../../place-trade'
import type { GateStat, ReportTrade } from '../types/report'

/**
 * Aggregates the Minervini non-negotiables across closed trades.
 *
 * Nothing is re-judged here. Each trade froze its own gate verdicts at placement (see
 * `TradeRatingSnapshot`), so this only counts them — `fromRatingSnapshot` is used purely
 * to look the gate's label and reason back up by id. Re-deriving a gate from the raw setup
 * would mean a rule could say one thing on the Trade Detail page and another here.
 *
 * A `pending` gate — one whose inputs were never filled in — is left out of the
 * denominator rather than counted as a failure.
 */
export function buildGateStats(reportTrades: ReportTrade[]): GateStat[] {
  const byId = new Map<string, GateStat>()

  for (const reportTrade of reportTrades) {
    const snapshot = reportTrade.trade.setup?.rating
    if (!snapshot) continue

    for (const gate of fromRatingSnapshot(snapshot).gates) {
      if (gate.state === 'pending') continue

      let stat = byId.get(gate.id)
      if (!stat) {
        stat = {
          id: gate.id,
          label: gate.label,
          reason: gate.reason,
          passed: [],
          failed: [],
          complianceRatio: 0,
          leakCost: 0,
        }
        byId.set(gate.id, stat)
      }

      if (gate.state === 'pass') {
        stat.passed.push(reportTrade)
      } else {
        stat.failed.push(reportTrade)
        stat.leakCost += reportTrade.trade.metrics.pnl ?? 0
      }
    }
  }

  const stats = [...byId.values()]
  for (const stat of stats) {
    const judged = stat.passed.length + stat.failed.length
    stat.complianceRatio = judged === 0 ? 0 : stat.passed.length / judged
  }

  // Worst compliance first, so the biggest leak is always the top row. Ties break on the
  // more expensive rule.
  return stats.sort(
    (a, b) => a.complianceRatio - b.complianceRatio || a.leakCost - b.leakCost,
  )
}
