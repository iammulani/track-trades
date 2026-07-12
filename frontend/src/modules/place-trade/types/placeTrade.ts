/** Values collected in the "Trade Setup" step — strings while editing, parsed on submit. */
export interface TradeParams {
  entryPrice: string
  stopLoss: string
  target: string
  quantity: string
}

export const EMPTY_TRADE_PARAMS: TradeParams = {
  entryPrice: '',
  stopLoss: '',
  target: '',
  quantity: '',
}

/** Values collected in the "Confirm Your Edge" step. */
export interface EdgeAnswers {
  thesis: string
  alignedWithPlan: boolean | null
}

export const EMPTY_EDGE_ANSWERS: EdgeAnswers = {
  thesis: '',
  alignedWithPlan: null,
}

/** Pre-trade checklist item id -> checked. */
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
