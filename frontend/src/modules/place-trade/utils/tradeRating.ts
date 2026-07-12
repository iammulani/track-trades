import type { WatchSide } from '../../watchlist'
import type {
  ChecklistChecked,
  IndicatorData,
  StageBaseAnswers,
  TradeParams,
  VcpStructureData,
} from '../types/placeTrade'
import type { ChecklistItem } from './checklistItems'
import {
  contractionCountTone,
  largestCorrectionTone,
  narrowestPullbackTone,
  weeksInBaseTone,
} from './finalChecksCalc'
import { BREAKOUT_CONFIRMATION_CHECKLIST_ITEMS, OVERHEAD_SUPPLY_CHECKLIST_ITEMS } from './finalChecksItems'
import { computeIndicatorRange, rsiTone } from './indicatorCalc'
import { INDICATOR_CHECKLIST_ITEMS } from './indicatorChecklistItems'
import { computeRisk } from './riskCalc'
import { BASE_OPTIONS, STAGE_OPTIONS } from './stageBaseOptions'

export interface RatingCriterion {
  id: string
  label: string
  met: boolean
}

export interface TradeRating {
  earned: number
  total: number
  criteria: RatingCriterion[]
}

function isGoodTone(tone: string | undefined): boolean {
  return tone === 'good' || tone === 'best'
}

function allChecked(items: ChecklistItem[], checked: ChecklistChecked): boolean {
  return items.every((item) => checked[item.id])
}

/** One star per criterion — 7 total, each reusing the tone/threshold logic
 * already established in its own step. Never stored, recomputed live. */
export function computeTradeRating(input: {
  side: WatchSide
  tradeParams: TradeParams
  stageBaseAnswers: StageBaseAnswers
  indicatorData: IndicatorData
  indicatorChecklistChecked: ChecklistChecked
  vcpStructureData: VcpStructureData
  finalChecksChecked: ChecklistChecked
}): TradeRating {
  const {
    side,
    tradeParams,
    stageBaseAnswers,
    indicatorData,
    indicatorChecklistChecked,
    vcpStructureData,
    finalChecksChecked,
  } = input

  const risk = computeRisk(side, tradeParams)
  const stage = STAGE_OPTIONS.find((s) => s.id === stageBaseAnswers.stage)
  const base = BASE_OPTIONS.find((b) => b.id === stageBaseAnswers.base)
  const range = computeIndicatorRange(
    tradeParams.entryPrice,
    indicatorData.week52Low,
    indicatorData.week52High,
  )

  const criteria: RatingCriterion[] = [
    {
      id: 'risk-reward',
      label: 'Risk : Reward is 2:1 or better',
      met: risk.riskRewardRatio !== null && risk.riskRewardRatio >= 2,
    },
    {
      id: 'stage-quality',
      label: 'Stage is a good trading area',
      met: isGoodTone(stage?.tone),
    },
    {
      id: 'base-quality',
      label: 'Base quality is good',
      met: isGoodTone(base?.tone),
    },
    {
      id: 'technical-confirmation',
      label: 'MA checklist confirmed and RSI is strong (80+)',
      met:
        allChecked(INDICATOR_CHECKLIST_ITEMS, indicatorChecklistChecked) &&
        rsiTone(indicatorData.rsi) === 'good',
    },
    {
      id: 'week-range',
      label: 'Well clear of the 52-week low and near the high',
      met:
        range.aboveLowPercent !== null &&
        range.aboveLowPercent >= 30 &&
        range.belowHighPercent !== null &&
        range.belowHighPercent <= 25,
    },
    {
      id: 'vcp-structure',
      label: 'VCP structure (time, price, symmetry) is textbook',
      met:
        weeksInBaseTone(vcpStructureData.weeksInBase) === 'good' &&
        largestCorrectionTone(vcpStructureData.largestCorrectionPercent) === 'good' &&
        narrowestPullbackTone(vcpStructureData.narrowestPullbackPercent) === 'good' &&
        contractionCountTone(vcpStructureData.contractionCount) === 'good',
    },
    {
      id: 'final-checks',
      label: 'Overhead supply and breakout confirmation fully checked',
      met:
        allChecked(OVERHEAD_SUPPLY_CHECKLIST_ITEMS, finalChecksChecked) &&
        allChecked(BREAKOUT_CONFIRMATION_CHECKLIST_ITEMS, finalChecksChecked),
    },
  ]

  return {
    earned: criteria.filter((c) => c.met).length,
    total: criteria.length,
    criteria,
  }
}

export interface RatingVerdict {
  label: string
  tone: 'good' | 'caution' | 'bad'
}

/** A quick read on the overall score — good at 85%+, caution at 50%+, bad below. */
export function ratingVerdict(rating: TradeRating): RatingVerdict {
  const ratio = rating.total === 0 ? 0 : rating.earned / rating.total
  if (ratio >= 0.85) return { label: 'Excellent setup', tone: 'good' }
  if (ratio >= 0.5) return { label: 'Good setup', tone: 'caution' }
  return { label: 'Weak setup — reconsider', tone: 'bad' }
}
