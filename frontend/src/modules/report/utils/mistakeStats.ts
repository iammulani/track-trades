import { EXIT_REASON_OPTIONS, exitReasonLabel } from '../../trades'
import type { MistakeStat, ReportTrade } from '../types/report'

/** The self-flagged mistake categories, as opposed to the neutral ways out (hit target,
 * stopped as planned, …). Derived from the taxonomy's own ids rather than a second list,
 * so adding a `mistake-*` reason to `EXIT_REASON_OPTIONS` gets counted here for free. */
export const MISTAKE_REASONS = new Set(
  EXIT_REASON_OPTIONS.filter((o) => o.value.startsWith('mistake-')).map((o) => o.value),
)

/**
 * Groups every exit learning by its reason and keeps the notes **verbatim**. The notes are
 * the most valuable text in the journal — the report quotes them rather than summarising
 * them into a count, because "15-second FOMO entry right at market open" is the finding.
 *
 * Mistakes first (most frequent first), then the neutral reasons.
 */
export function buildMistakeStats(reportTrades: ReportTrade[]): MistakeStat[] {
  const byReason = new Map<string, MistakeStat>()

  for (const { trade } of reportTrades) {
    for (const learning of trade.exitLearnings ?? []) {
      let stat = byReason.get(learning.reason)
      if (!stat) {
        stat = {
          reason: learning.reason,
          label: exitReasonLabel(learning.reason) ?? learning.reason,
          count: 0,
          isMistake: MISTAKE_REASONS.has(learning.reason),
          notes: [],
        }
        byReason.set(learning.reason, stat)
      }
      stat.count += 1
      if (learning.note.trim() !== '') {
        stat.notes.push({ symbol: trade.symbol, note: learning.note })
      }
    }
  }

  return [...byReason.values()].sort(
    (a, b) => Number(b.isMistake) - Number(a.isMistake) || b.count - a.count,
  )
}

/** How many trades carry at least one self-flagged mistake — the headline of the ledger. */
export function countTradesWithMistakes(reportTrades: ReportTrade[]): number {
  return reportTrades.filter(({ trade }) =>
    (trade.exitLearnings ?? []).some((l) => MISTAKE_REASONS.has(l.reason)),
  ).length
}
