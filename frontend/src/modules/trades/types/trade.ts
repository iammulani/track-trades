export type TradeSide = 'long' | 'short'
export type TradeStatus = 'open' | 'closed'
export type TradeOutcome = 'win' | 'loss' | 'breakeven'

/** Why a trade was exited — a fixed, reportable taxonomy (see `utils/exitReasons.ts`
 * for labels). Deliberately closed-ended rather than free text, so future reports can
 * group/count by it. */
export type ExitReason =
  | 'hit-target'
  | 'stopped-as-planned'
  | 'stopped-widened'
  | 'trailing-stop'
  | 'thesis-changed'
  | 'time-based'
  | 'mistake-emotional'
  | 'mistake-broke-rule'
  | 'mistake-missed-signal'
  | 'market-news-event'
  | 'other'

/** One exit takeaway — a reason (the reportable category) paired with its own note.
 * A trade can have several of these (see `MAX_EXIT_REASONS`), each independent —
 * e.g. "Hit Target" / "sold into strength exactly at resistance" and, separately,
 * "Mistake — Broke Trading Rule" / "moved my stop up too early out of fear". */
export interface ExitLearning {
  reason: ExitReason
  note: string
}

export type TradeStage = 'stage-1' | 'transition-1-2' | 'stage-2' | 'stage-3' | 'stage-4'
export type TradeBase = 'base-1' | 'base-2' | 'base-3' | 'base-4'

/** Checklist item id -> checked, captured verbatim from whichever checklist collected it. */
export type TradeChecklist = Record<string, boolean>

/** One VCP contraction (T) as placed — high/low already resolved to numbers. */
export interface TradeVcpContraction {
  high: number
  low: number
}

/** Everything the place-trade stepper collects beyond the core fill data — a
 * point-in-time record of the setup that justified the trade, kept for later
 * analysis (e.g. "do tight VCPs actually outperform?"). Never recomputed —
 * `ratingRatio` is the score as it stood at placement, not a live value. */
export interface TradeSetup {
  /** From the watchlist item's `watchedSince` — how long it was watched before being traded. */
  watchedSince: string | null
  stopLoss: number | null
  target: number | null
  stage: TradeStage | null
  base: TradeBase | null
  rsi: number | null
  fiftyDayMa: number | null
  technicalChecklist: TradeChecklist
  week52Low: number | null
  week52High: number | null
  weeksInBase: number | null
  vcpContractions: TradeVcpContraction[]
  finalChecks: TradeChecklist
  /** computeTradeRating().ratio at the moment the trade was placed, 0..1. */
  ratingRatio: number | null
}

/** Raw trade as stored in db.json. */
export interface Trade {
  id: string
  symbol: string
  side: TradeSide
  quantity: number
  entryPrice: number
  exitPrice: number | null
  entryTime: string
  exitTime: string | null
  notes?: string
  /** Absent for trades placed before this was captured, or entered outside the stepper. */
  setup?: TradeSetup | null
  /** Set together with exitPrice/exitTime when the trade is closed. Zero to
   * `MAX_EXIT_REASONS` (see utils/exitReasons.ts) entries, each its own reason + note. */
  exitLearnings?: ExitLearning[]
}

/** Values derived from a single trade (see tradeMetrics.ts). */
export interface TradeMetrics {
  status: TradeStatus
  pnl: number | null
  pnlPercent: number | null
  outcome: TradeOutcome | null
  durationMs: number
}

/** A trade paired with its derived metrics — what the UI consumes. */
export interface TradeWithMetrics extends Trade {
  metrics: TradeMetrics
}

/** Aggregate metrics across all trades. */
export interface DashboardSummary {
  totalTrades: number
  openTrades: number
  closedTrades: number
  wins: number
  losses: number
  winRate: number
  netPnl: number
  avgReturnPercent: number
  avgDurationMs: number
  bestTrade: TradeWithMetrics | null
  worstTrade: TradeWithMetrics | null
}

/** A newly-placed trade — always opens with no exit yet. */
export interface NewTrade {
  symbol: string
  side: TradeSide
  quantity: number
  entryPrice: number
  entryTime: string
  notes?: string
  setup?: TradeSetup | null
}

/** What closing an open trade writes. */
export interface CloseTradeInput {
  exitPrice: number
  exitTime: string
  exitLearnings: ExitLearning[]
}
