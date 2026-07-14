import type { IndicatorData, StageBaseAnswers, TradeParams, VcpStructureData } from '../../drafts'
import type { TradeBase, TradeStage } from '../../trades'

/** The stepper's form state is exactly what a draft persists, so `modules/drafts` is its
 * canonical home — re-exported here so every step component keeps importing it from its
 * own module. Same arrangement as `Stage`/`Base` below. */
export type {
  ChecklistChecked,
  IndicatorData,
  StageBaseAnswers,
  TradeParams,
  VcpContraction,
  VcpStructureData,
} from '../../drafts'

export const EMPTY_TRADE_PARAMS: TradeParams = {
  entryPrice: '',
  stopLoss: '',
  target: '',
  quantity: '',
  entryDate: '',
}

/** Re-exported from `modules/trades` — it's the canonical definition since the
 * chosen stage/base is now persisted as part of the trade's `setup`. */
export type Stage = TradeStage
export type Base = TradeBase

export const EMPTY_STAGE_BASE_ANSWERS: StageBaseAnswers = {
  stage: null,
  base: null,
}

export const EMPTY_INDICATOR_DATA: IndicatorData = {
  rsRating: '70',
  fiftyDayMa: '',
  week52Low: '',
  week52High: '',
}

export const MIN_VCP_CONTRACTIONS = 2
export const MAX_VCP_CONTRACTIONS = 6

export const EMPTY_VCP_STRUCTURE_DATA: VcpStructureData = {
  weeksInBase: '',
  contractions: [
    { high: '', low: '' },
    { high: '', low: '' },
  ],
}
