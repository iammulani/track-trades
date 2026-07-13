/** Values collected in the "Trade Setup" step — strings while editing, parsed on submit. */
export interface TradeParams {
  entryPrice: string
  stopLoss: string
  target: string
  quantity: string
  /** yyyy-mm-dd — defaults to today, can be backdated to log a trade placed earlier. */
  entryDate: string
}

export const EMPTY_TRADE_PARAMS: TradeParams = {
  entryPrice: '',
  stopLoss: '',
  target: '',
  quantity: '',
  entryDate: '',
}

/** Checklist item id -> checked, used by the various step checklists. */
export type ChecklistChecked = Record<string, boolean>

export type Stage = 'stage-1' | 'transition-1-2' | 'stage-2' | 'stage-3' | 'stage-4'
export type Base = 'base-1' | 'base-2' | 'base-3' | 'base-4'

/** Values collected in the "Stage & Base" step — one stage, one base, or neither yet. */
export interface StageBaseAnswers {
  stage: Stage | null
  base: Base | null
}

export const EMPTY_STAGE_BASE_ANSWERS: StageBaseAnswers = {
  stage: null,
  base: null,
}

/** Values collected in the Technical Confirmation / 52-Week Range steps —
 * strings while editing, parsed for the live % calcs. */
export interface IndicatorData {
  rsi: string
  fiftyDayMa: string
  week52Low: string
  week52High: string
}

export const EMPTY_INDICATOR_DATA: IndicatorData = {
  rsi: '70',
  fiftyDayMa: '',
  week52Low: '',
  week52High: '',
}

/** One contraction (T) — a high and a low; the % pullback is derived, never entered directly. */
export interface VcpContraction {
  high: string
  low: string
}

export const MIN_VCP_CONTRACTIONS = 2
export const MAX_VCP_CONTRACTIONS = 6

/** Values collected in the "VCP Structure" step — strings while editing. */
export interface VcpStructureData {
  weeksInBase: string
  contractions: VcpContraction[]
}

export const EMPTY_VCP_STRUCTURE_DATA: VcpStructureData = {
  weeksInBase: '',
  contractions: [
    { high: '', low: '' },
    { high: '', low: '' },
  ],
}
