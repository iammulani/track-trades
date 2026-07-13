import { fromRatingSnapshot } from '../../place-trade'
import type { CriterionStat, ReportTrade } from '../types/report'

/**
 * Averages each rating criterion's stored score across closed trades — the answer to
 * "which part of my setup work is chronically weak?".
 *
 * Criteria don't share a denominator: `risk-reward` is dropped from the rating entirely
 * when a trade has no target (it's unmeasurable, not bad), so each criterion counts only
 * the trades it was actually scored on.
 *
 * Sorted worst first, and within an equal score the heavier criterion leads — a 0 on a
 * weight-3 criterion is doing three times the damage of a 0 on a weight-1 one.
 */
export function buildCriterionStats(reportTrades: ReportTrade[]): CriterionStat[] {
  const byId = new Map<string, { label: string; weight: number; total: number; count: number }>()

  for (const reportTrade of reportTrades) {
    const snapshot = reportTrade.trade.setup?.rating
    if (!snapshot) continue

    for (const criterion of fromRatingSnapshot(snapshot).criteria) {
      const entry = byId.get(criterion.id) ?? {
        label: criterion.label,
        weight: criterion.weight,
        total: 0,
        count: 0,
      }
      entry.total += criterion.score
      entry.count += 1
      byId.set(criterion.id, entry)
    }
  }

  return [...byId.entries()]
    .map(([id, entry]) => ({
      id,
      label: entry.label,
      weight: entry.weight,
      avgScore: entry.count === 0 ? 0 : entry.total / entry.count,
      tradeCount: entry.count,
    }))
    .sort((a, b) => a.avgScore - b.avgScore || b.weight - a.weight)
}
