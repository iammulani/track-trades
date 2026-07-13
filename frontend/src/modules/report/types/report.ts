import type { TradeWithMetrics } from '../../trades'

/** A closed trade paired with the two numbers the report keeps asking for: what it
 * actually returned in units of the risk taken (R), and the setup score it was given at
 * placement. Either can be `null` — a trade with no stop has no R, and a trade placed
 * before the rating existed has no score. */
export interface ReportTrade {
  trade: TradeWithMetrics
  /** Realized R-multiple: P&L per share ÷ planned risk per share. −1 means "lost exactly
   * what I said I was willing to lose"; below −1 means the stop leaked. */
  rMultiple: number | null
  /** The frozen setup rating, 0..1 (see `TradeRatingSnapshot`). */
  ratingRatio: number | null
}

/** One Minervini non-negotiable, aggregated across every trade that could be judged on it. */
export interface GateStat {
  id: string
  label: string
  /** Why the rule is non-negotiable — the gate's own stored prose. */
  reason: string
  passed: ReportTrade[]
  failed: ReportTrade[]
  /** passed / (passed + failed), 0..1. Trades that couldn't be judged are excluded from
   * the denominator entirely, so a `pending` gate never reads as a failure. */
  complianceRatio: number
  /** Summed P&L of the trades that failed this gate — what breaking the rule has cost. */
  leakCost: number
}

/** One rating criterion, averaged across trades. */
export interface CriterionStat {
  id: string
  label: string
  /** Mean of the stored 0..1 scores. */
  avgScore: number
  /** The criterion's weight in the rating — how much a low score actually costs. */
  weight: number
  /** How many trades this criterion was scored on (R:R is dropped when there's no target,
   * so criteria don't all share a denominator). */
  tradeCount: number
}

/** Performance aggregates. Anything undefined at this sample size is `null`, never NaN. */
export interface PerformanceStats {
  closedCount: number
  netPnl: number
  winRate: number
  wins: number
  losses: number
  /** Mean realized R across trades that have one — the number that says whether the
   * system makes money per unit of risk. `null` if no trade has a stop. */
  expectancyR: number | null
  /** Gross profit ÷ gross loss. `null` with no winners (it would be 0 or ∞, both lies). */
  profitFactor: number | null
  /** Avg win ÷ avg loss, in currency. `null` with no winners. */
  payoffRatio: number | null
  /** Largest peak-to-trough drop in cumulative P&L. */
  maxDrawdown: number
  avgHoldWinnersMs: number | null
  avgHoldLosersMs: number | null
  /** Trades taken even though the rating said "don't trade" — the discipline number. */
  tradedAgainstRating: number
  /** How many trades carry a rating at all — `tradedAgainstRating`'s denominator. */
  ratedCount: number
  /** Trades that lost more than the risk they planned (R < −1) — a leaked stop. */
  stopLeaks: number
}

/** One exit-reason bucket, with the notes written against it. */
export interface MistakeStat {
  reason: string
  label: string
  count: number
  /** Whether this reason is one of the self-flagged `mistake-*` categories. */
  isMistake: boolean
  notes: { symbol: string; note: string }[]
}
