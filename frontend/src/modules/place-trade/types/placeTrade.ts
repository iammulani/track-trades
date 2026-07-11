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
