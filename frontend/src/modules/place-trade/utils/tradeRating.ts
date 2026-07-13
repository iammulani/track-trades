import type { IconName } from '../../../shared/components/Icon'
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
  contractionsTightening,
  largestCorrectionTone,
  narrowestPullbackTone,
  weeksInBaseTone,
} from './finalChecksCalc'
import { BREAKOUT_CONFIRMATION_CHECKLIST_ITEMS, OVERHEAD_SUPPLY_CHECKLIST_ITEMS } from './finalChecksItems'
import { computeIndicatorRange, computeMaDistancePercent, maDistanceTone, rsiTone } from './indicatorCalc'
import { INDICATOR_CHECKLIST_ITEMS } from './indicatorChecklistItems'
import { computeRisk } from './riskCalc'
import { BASE_OPTIONS, STAGE_OPTIONS } from './stageBaseOptions'

export interface RatingCriterion {
  id: string
  label: string
  /** Relative importance; the decisive-but-underrepresented criteria carry more. */
  weight: number
  /** 0 (miss) … 1 (fully met), with partial credit in between. */
  score: number
}

export interface TradeRating {
  /** Weighted share of the total earned, 0..1. */
  ratio: number
  /** Weighted points earned / available — what `ratio` is the quotient of. */
  earnedWeight: number
  totalWeight: number
  criteria: RatingCriterion[]
}

export type CriterionState = 'met' | 'partial' | 'unmet'

export function criterionState(criterion: RatingCriterion): CriterionState {
  if (criterion.score >= 1) return 'met'
  if (criterion.score > 0) return 'partial'
  return 'unmet'
}

/** Shared by the badge hover-card and the Review breakdown, so the two can't drift. */
export const CRITERION_STATE_ICON: Record<CriterionState, IconName> = {
  met: 'check',
  partial: 'alert',
  unmet: 'x',
}

/** Points a criterion actually contributed, out of its `weight`. */
export function criterionPoints(criterion: RatingCriterion): number {
  return criterion.weight * criterion.score
}

/** 2 → "2", 1.6 → "1.6" — keeps whole points clean. Shared by the Review step's
 * breakdown and the read-only Trade Detail page's. */
export function formatPoints(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

/** best/good → full, caution → half, anything else (bad/none) → nothing. */
function toneScore(tone: string | undefined): number {
  if (tone === 'best' || tone === 'good') return 1
  if (tone === 'caution') return 0.5
  return 0
}

/** Share of a checklist that's ticked — gives partial credit rather than all-or-nothing. */
function fractionChecked(items: ChecklistItem[], checked: ChecklistChecked): number {
  if (items.length === 0) return 0
  return items.filter((item) => checked[item.id]).length / items.length
}

function boolScore(condition: boolean): number {
  return condition ? 1 : 0
}

/** Weighted, partial-credit rating — each criterion reuses the tone/threshold logic already
 * established in its own step, and `caution` reads earn half. Never stored, recomputed live. */
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
  const maDistance = computeMaDistancePercent(tradeParams.entryPrice, indicatorData.fiftyDayMa)

  const rr = risk.riskRewardRatio
  const riskRewardScore = rr === null ? 0 : rr >= 2 ? 1 : rr >= 1 ? 0.5 : 0

  const vcpMet = [
    weeksInBaseTone(vcpStructureData.weeksInBase) === 'good',
    largestCorrectionTone(vcpStructureData.contractions) === 'good',
    narrowestPullbackTone(vcpStructureData.contractions) === 'good',
    contractionCountTone(vcpStructureData.contractions) === 'good',
    contractionsTightening(vcpStructureData.contractions),
  ].filter(Boolean).length

  const weekRangeScore =
    0.5 * boolScore(range.aboveLowPercent !== null && range.aboveLowPercent >= 30) +
    0.5 * boolScore(range.belowHighPercent !== null && range.belowHighPercent <= 25)

  const criteria: RatingCriterion[] = [
    {
      id: 'risk-reward',
      label: 'Risk : Reward is 2:1 or better',
      weight: 2,
      score: riskRewardScore,
    },
    {
      id: 'stage-quality',
      label: 'Stage is a good trading area',
      weight: 1,
      score: toneScore(stage?.tone),
    },
    {
      id: 'base-quality',
      label: 'Base quality is good',
      weight: 1,
      score: toneScore(base?.tone),
    },
    {
      id: 'ma-trend',
      label: 'Moving-average structure confirmed',
      weight: 1,
      score: fractionChecked(INDICATOR_CHECKLIST_ITEMS, indicatorChecklistChecked),
    },
    {
      id: 'relative-strength',
      label: 'RSI is strong (70+, ideally 80+)',
      weight: 1,
      score: toneScore(rsiTone(indicatorData.rsi)),
    },
    {
      id: 'ma-proximity',
      label: 'Entry is close to the 50-day MA (not extended)',
      weight: 1,
      score: toneScore(maDistanceTone(maDistance)),
    },
    {
      id: 'week-range',
      label: 'Well clear of the 52-week low and near the high',
      weight: 1,
      score: weekRangeScore,
    },
    {
      id: 'vcp-structure',
      label: 'VCP structure (time, price, symmetry, tightening) is textbook',
      weight: 2,
      score: vcpMet / 5,
    },
    {
      id: 'final-checks',
      label: 'Overhead supply and breakout confirmation checked',
      weight: 1,
      score: fractionChecked(
        [...OVERHEAD_SUPPLY_CHECKLIST_ITEMS, ...BREAKOUT_CONFIRMATION_CHECKLIST_ITEMS],
        finalChecksChecked,
      ),
    },
  ]

  const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0)
  const earnedWeight = criteria.reduce((sum, c) => sum + criterionPoints(c), 0)

  return {
    ratio: totalWeight === 0 ? 0 : earnedWeight / totalWeight,
    earnedWeight,
    totalWeight,
    criteria,
  }
}

export interface RatingVerdict {
  label: string
  tone: 'good' | 'caution' | 'bad'
}

/** A quick read on a 0..1 score — good at 85%+, caution at 50%+, bad below. Takes a bare
 * ratio (not the full `TradeRating`) so it also works wherever only a ratio is on hand. */
export function ratingVerdict(ratio: number): RatingVerdict {
  if (ratio >= 0.85) return { label: 'Excellent setup', tone: 'good' }
  if (ratio >= 0.5) return { label: 'Good setup', tone: 'caution' }
  return { label: 'Weak setup — reconsider', tone: 'bad' }
}
