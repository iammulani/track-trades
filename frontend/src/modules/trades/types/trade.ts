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
  | 'mistake-early-entry'
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

/** One criterion exactly as it scored at placement. Only the numbers are kept — the
 * label is looked up from code by `id` when rendering, so wording can be reworded later
 * without rewriting history. */
export interface TradeRatingCriterionSnapshot {
  id: string
  weight: number
  score: number
}

/** One non-negotiable exactly as it stood at placement, including the `cap` in force at
 * the time — so re-tuning a cap later can't retroactively move an old trade's score. */
export interface TradeRatingGateSnapshot {
  id: string
  state: 'pass' | 'fail' | 'pending'
  cap: number
}

/** The rating **as judged at the moment the trade was placed**, frozen. This is the one
 * thing in the app that is deliberately stored rather than derived (see convention 4 in
 * CLAUDE.md): a rating is a point-in-time judgement, not a fact about the raw numbers, so
 * re-tuning the formula must not silently re-grade trades you already took. Everything the
 * Trade Detail page shows — stars, verdict, cap banner, per-criterion points — is rendered
 * from this, never recomputed. */
export interface TradeRatingSnapshot {
  /** The score that counted, after any failed gate's cap, 0..1. */
  ratio: number
  /** The weighted criteria score before caps, 0..1 — what the points breakdown sums to. */
  rawRatio: number
  criteria: TradeRatingCriterionSnapshot[]
  gates: TradeRatingGateSnapshot[]
}

/** Everything the place-trade stepper collects beyond the core fill data — a
 * point-in-time record of the setup that justified the trade, kept for later
 * analysis (e.g. "do tight VCPs actually outperform?"). */
export interface TradeSetup {
  /** From the watchlist item's `watchedSince` — how long it was watched before being traded. */
  watchedSince: string | null
  stopLoss: number | null
  target: number | null
  stage: TradeStage | null
  base: TradeBase | null
  /** RSI — no less than 70, preferably in the 80s & 90s. */
  rsi: number | null
  fiftyDayMa: number | null
  technicalChecklist: TradeChecklist
  week52Low: number | null
  week52High: number | null
  weeksInBase: number | null
  vcpContractions: TradeVcpContraction[]
  finalChecks: TradeChecklist
  /** The frozen rating (see `TradeRatingSnapshot`). `null` only for trades placed before
   * the rating existed, or entered outside the stepper. */
  rating: TradeRatingSnapshot | null
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
