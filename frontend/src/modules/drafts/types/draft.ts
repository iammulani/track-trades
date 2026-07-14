import type { TradeBase, TradeStage } from '../../trades'

/** Values collected in the "Trade Setup" step — strings while editing, parsed on submit. */
export interface TradeParams {
  entryPrice: string
  stopLoss: string
  target: string
  quantity: string
  /** yyyy-mm-dd — defaults to today, can be backdated to log a trade placed earlier. */
  entryDate: string
}

/** Checklist item id -> checked, used by the various step checklists. */
export type ChecklistChecked = Record<string, boolean>

/** Values collected in the "Stage & Base" step — one stage, one base, or neither yet. */
export interface StageBaseAnswers {
  stage: TradeStage | null
  base: TradeBase | null
}

/** Values collected in the Technical Confirmation / 52-Week Range steps —
 * strings while editing, parsed for the live % calcs. */
export interface IndicatorData {
  /** IBD-style RS Rating — a 1-99 percentile vs the market, not RSI(14). */
  rsRating: string
  fiftyDayMa: string
  week52Low: string
  week52High: string
}

/** One contraction (T) — a high and a low; the % pullback is derived, never entered directly. */
export interface VcpContraction {
  high: string
  low: string
}

/** Values collected in the "VCP Structure" step — strings while editing. */
export interface VcpStructureData {
  weeksInBase: string
  contractions: VcpContraction[]
}

/**
 * Everything the place-trade stepper holds mid-run: which step you're on, plus each
 * step's answers **exactly as typed** (strings, not parsed numbers) — so resuming
 * restores the inputs rather than a re-rendering of them.
 *
 * The rating is deliberately absent: it's derived live from these answers by
 * `computeTradeRating()` and only frozen into the trade at placement.
 */
export interface DraftStepperState {
  stepIndex: number
  tradeParams: TradeParams
  stageBaseAnswers: StageBaseAnswers
  indicatorData: IndicatorData
  indicatorChecklistChecked: ChecklistChecked
  vcpStructureData: VcpStructureData
  finalChecksChecked: ChecklistChecked
}

/** A parked stepper run, as stored in db.json. One per watchlist item. */
export interface TradeDraft extends DraftStepperState {
  id: string
  /** The watchlist item this draft belongs to — the draft's identity. */
  watchlistId: string
  createdAt: string
  updatedAt: string
}

/** What creating a draft writes — the timestamps are stamped by the API layer. */
export interface NewTradeDraft extends DraftStepperState {
  watchlistId: string
}
