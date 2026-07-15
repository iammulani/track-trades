import type { IconName } from '../../../shared/components/Icon'
import type { TradeRatingSnapshot } from '../../trades'
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
  filledContractionCount,
  largestCorrectionTone,
  narrowestPullbackTone,
  weeksInBaseTone,
} from './finalChecksCalc'
import { BREAKOUT_CONFIRMATION_CHECKLIST_ITEMS, OVERHEAD_SUPPLY_CHECKLIST_ITEMS } from './finalChecksItems'
import { computeIndicatorRange, rsiTone } from './indicatorCalc'
import { INDICATOR_CHECKLIST_ITEMS } from './indicatorChecklistItems'
import { computeRisk } from './riskCalc'
import { BASE_OPTIONS, STAGE_OPTIONS } from './stageBaseOptions'
import { checkStopPlacement, stopPlacementScore } from './stopPlacement'

/** The rating is shown out of 5 stars. Single source of truth — `RatingStars` renders this
 * many glyphs, and `TradeRating.stars` is scaled to it. */
export const RATING_STARS = 5

export interface RatingCriterion {
  id: string
  label: string
  /** Relative importance; the decisive-but-underrepresented criteria carry more. */
  weight: number
  /** 0 (miss) … 1 (fully met), with partial credit in between. */
  score: number
}

/** `pending` = the inputs this gate reads haven't been entered yet, so it can't judge —
 * distinct from `fail`, and it must never cap (or the badge would read red on step 1). */
export type GateState = 'pass' | 'fail' | 'pending'

/** A Minervini non-negotiable. Unlike a criterion — which trades points against the others —
 * a failed gate *caps* the whole score, so a setup can't average its way past a broken rule. */
export interface RatingGate {
  id: string
  label: string
  state: GateState
  /** The highest ratio (0..1) the trade may score while this gate is failing. */
  cap: number
  /** Why the rule is non-negotiable — shown when it fails. */
  reason: string
}

export interface TradeRating {
  /** The score that counts: `rawRatio` after every failed gate's cap is applied, 0..1. */
  ratio: number
  /** The weighted score before caps — what the criteria alone add up to, 0..1. */
  rawRatio: number
  /** `ratio` on the 0..RATING_STARS scale the UI shows. */
  stars: number
  /** Weighted points earned / available — what `rawRatio` is the quotient of. */
  earnedWeight: number
  totalWeight: number
  criteria: RatingCriterion[]
  gates: RatingGate[]
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

/** A star score always reads to one decimal — "4.2", "2.0" — so two setups a tenth apart
 * still look different. */
export function formatStars(value: number): string {
  return value.toFixed(1)
}

/** The gates that failed and are therefore holding the score down, tightest cap first. */
export function bindingGates(rating: TradeRating): RatingGate[] {
  return rating.gates.filter((g) => g.state === 'fail').sort((a, b) => a.cap - b.cap)
}

/** best/good → full, caution → a token 0.3, anything else (bad/none) → nothing. Half-credit
 * for a `caution` read is what used to let a mediocre setup average its way into "Good". */
function toneScore(tone: string | undefined): number {
  if (tone === 'best' || tone === 'good') return 1
  if (tone === 'caution') return 0.3
  return 0
}

/** Share of a checklist that's ticked — gives partial credit rather than all-or-nothing. */
function fractionChecked(items: ChecklistItem[], checked: ChecklistChecked): number {
  if (items.length === 0) return 0
  return items.filter((item) => checked[item.id]).length / items.length
}

function allChecked(items: ChecklistItem[], checked: ChecklistChecked): boolean {
  return items.every((item) => checked[item.id])
}

function boolScore(condition: boolean): number {
  return condition ? 1 : 0
}

/** `null` in `knowns` means "not entered yet". Any known failure fails the gate; otherwise a
 * missing input leaves it pending. Keeps every gate's pending/fail rule identical. */
function gateState(knowns: (boolean | null)[]): GateState {
  if (knowns.some((k) => k === false)) return 'fail'
  if (knowns.some((k) => k === null)) return 'pending'
  return 'pass'
}

/** The wording and default ceiling of each non-negotiable, keyed by the id that gets
 * persisted. Kept out of `computeTradeRating` so a stored snapshot can be rendered back
 * with the same copy (see `fromRatingSnapshot`) — the numbers are history, the prose isn't,
 * so reworded copy shows up on old trades while their scores stay put. */
const GATE_META: Record<string, { label: string; cap: number; reason: string }> = {
  'stage-2': {
    label: 'Stage 2 — the stock is in a confirmed advance',
    cap: 0.4,
    reason:
      'Only Stage 2 is tradable. Stage 1 has not turned yet, Stage 3 is topping, Stage 4 is falling — and a 1 → 2 transition has not proved itself. Buying outside Stage 2 is fighting the trend, however good the rest of the setup looks.',
  },
  'trend-template': {
    label: 'Trend Template — MA structure, ≥30% off the low, within 25% of the high',
    cap: 0.6,
    reason:
      'The Trend Template is a filter, not a preference: the moving averages must be stacked and rising, price must be well clear of its 52-week low (≥30%) and pressing against its high (within 25%). A stock that fails it is not yet a leader.',
  },
  'logical-stop': {
    label: 'Stop is below the base and sized 2–10%',
    cap: 0.6,
    reason:
      'The stop belongs below the last contraction’s low — a level the thesis has to break to reach. A stop parked inside the base flatters the risk:reward on paper while guaranteeing a shake-out on ordinary noise; one further than 10% away is simply oversized.',
  },
  'real-base': {
    label: 'A real base — 5+ weeks, 2+ contractions, tightening',
    cap: 0.6,
    reason:
      'Under 5 weeks, with fewer than two contractions or no tightening, nothing has been shaken out — that is a pause, not a base. There is no pivot to buy and no supply has been absorbed.',
  },
}

/** Each criterion's wording, keyed by the id that gets persisted — same deal as `GATE_META`. */
const CRITERION_LABELS: Record<string, string> = {
  'risk-reward': 'Risk : Reward is 2:1 or better',
  'stop-placement': 'Stop sits below the base, risking 2–10%',
  'stage-quality': 'Stage is a good trading area',
  'base-quality': 'Base quality is good',
  'ma-trend': 'Moving-average structure confirmed',
  'relative-strength': 'RSI is strong (70+, ideally 80+)',
  // No longer produced by computeTradeRating — the 50-day MA is now a display-only warning
  // (TechnicalConfirmationStep), not a scored criterion. Kept here so trades rated before this
  // change still render their frozen 'ma-proximity' line correctly (see fromRatingSnapshot).
  'ma-proximity': 'Entry is close to the 50-day MA (not extended)',
  'week-range': 'Well clear of the 52-week low and near the high',
  'vcp-structure': 'VCP structure (time, price, symmetry, tightening) is textbook',
  'final-checks': 'Overhead supply and breakout confirmation checked',
}

function gate(id: string, state: GateState): RatingGate {
  const { label, cap, reason } = GATE_META[id]
  return { id, label, state, cap, reason }
}

function criterion(id: string, weight: number, score: number): RatingCriterion {
  return { id, label: CRITERION_LABELS[id], weight, score }
}

/** Weighted, partial-credit rating behind a set of hard gates. Each criterion reuses the
 * tone/threshold logic already established in its own step. Never stored, recomputed live. */
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
  const stop = checkStopPlacement(
    side,
    tradeParams.entryPrice,
    tradeParams.stopLoss,
    vcpStructureData.contractions,
  )

  const contractions = vcpStructureData.contractions
  const filledCount = filledContractionCount(contractions)
  const weeksInBase = Number(vcpStructureData.weeksInBase)
  const hasWeeksInBase =
    vcpStructureData.weeksInBase.trim() !== '' && Number.isFinite(weeksInBase)

  const aboveLowOk = range.aboveLowPercent === null ? null : range.aboveLowPercent >= 30
  const belowHighOk = range.belowHighPercent === null ? null : range.belowHighPercent <= 25

  const gates: RatingGate[] = [
    gate('stage-2', gateState([
      stageBaseAnswers.stage === null ? null : stageBaseAnswers.stage === 'stage-2',
    ])),
    gate('trend-template', gateState([
      range.aboveLowPercent === null || range.belowHighPercent === null
        ? null
        : allChecked(INDICATOR_CHECKLIST_ITEMS, indicatorChecklistChecked),
      aboveLowOk,
      belowHighOk,
    ])),
    gate('logical-stop', gateState([stop.beyondBase, stop.sizeOk])),
    gate('real-base', gateState([
      !hasWeeksInBase || filledCount === 0 ? null : weeksInBase >= 5,
      filledCount === 0 ? null : filledCount >= 2,
      filledCount === 0 ? null : contractionsTightening(contractions),
    ])),
  ]

  const stopGateFailed = gates.find((g) => g.id === 'logical-stop')?.state === 'fail'

  const rr = risk.riskRewardRatio
  /** A great ratio measured off a stop that can't be trusted isn't a real ratio. */
  const riskRewardScore = stopGateFailed || rr === null ? 0 : rr >= 2 ? 1 : rr >= 1 ? 0.5 : 0

  const vcpMet = [
    weeksInBaseTone(vcpStructureData.weeksInBase) === 'good',
    largestCorrectionTone(contractions) === 'good',
    narrowestPullbackTone(contractions) === 'good',
    contractionCountTone(contractions) === 'good',
    contractionsTightening(contractions),
  ].filter(Boolean).length

  const weekRangeScore = 0.5 * boolScore(aboveLowOk === true) + 0.5 * boolScore(belowHighOk === true)

  const hasTarget = tradeParams.target.trim() !== ''

  const criteria: RatingCriterion[] = [
    // Without a target there's no reward to measure, so R:R is dropped from the denominator
    // rather than scored 0 — it's unmeasurable, not bad.
    ...(hasTarget ? [criterion('risk-reward', 2, riskRewardScore)] : []),
    criterion('stop-placement', 1, stopPlacementScore(stop)),
    criterion('stage-quality', 2, toneScore(stage?.tone)),
    criterion('base-quality', 1, toneScore(base?.tone)),
    criterion('ma-trend', 1, fractionChecked(INDICATOR_CHECKLIST_ITEMS, indicatorChecklistChecked)),
    criterion('relative-strength', 1, toneScore(rsiTone(indicatorData.rsi))),
    criterion('week-range', 2, weekRangeScore),
    criterion('vcp-structure', 3, vcpMet / 5),
    criterion(
      'final-checks',
      1,
      fractionChecked(
        [...OVERHEAD_SUPPLY_CHECKLIST_ITEMS, ...BREAKOUT_CONFIRMATION_CHECKLIST_ITEMS],
        finalChecksChecked,
      ),
    ),
  ]

  return assembleRating(criteria, gates)
}

/** Totals, caps and stars — the arithmetic that turns criteria + gates into a score. Shared
 * by the live computation and by `fromRatingSnapshot`, so a replayed trade is put together
 * exactly the way it was originally. */
function assembleRating(criteria: RatingCriterion[], gates: RatingGate[]): TradeRating {
  const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0)
  const earnedWeight = criteria.reduce((sum, c) => sum + criterionPoints(c), 0)
  const rawRatio = totalWeight === 0 ? 0 : earnedWeight / totalWeight

  const caps = gates.filter((g) => g.state === 'fail').map((g) => g.cap)
  const ratio = Math.min(rawRatio, ...caps)

  return { ratio, rawRatio, stars: ratio * RATING_STARS, earnedWeight, totalWeight, criteria, gates }
}

/** Strip the rating down to what gets persisted: ids and numbers, no prose. Called once, at
 * placement. */
export function toRatingSnapshot(rating: TradeRating): TradeRatingSnapshot {
  return {
    ratio: rating.ratio,
    rawRatio: rating.rawRatio,
    criteria: rating.criteria.map((c) => ({ id: c.id, weight: c.weight, score: c.score })),
    gates: rating.gates.map((g) => ({ id: g.id, state: g.state, cap: g.cap })),
  }
}

/** Rebuild a full `TradeRating` from a stored snapshot so the UI can render it with the same
 * components — **without re-judging anything**. `ratio` and `rawRatio` are taken verbatim from
 * the snapshot rather than re-derived, so even re-tuning how caps combine can't move an old
 * trade's score; the weight totals are plain sums of the stored criteria, which cannot drift.
 * Only labels and reasons are looked up from code, by id. A trade keeps the grade it was given
 * on the day it was placed. */
export function fromRatingSnapshot(snapshot: TradeRatingSnapshot): TradeRating {
  const criteria: RatingCriterion[] = snapshot.criteria.map((c) => ({
    id: c.id,
    label: CRITERION_LABELS[c.id] ?? c.id,
    weight: c.weight,
    score: c.score,
  }))
  const gates: RatingGate[] = snapshot.gates.map((g) => ({
    id: g.id,
    label: GATE_META[g.id]?.label ?? g.id,
    state: g.state,
    cap: g.cap,
    reason: GATE_META[g.id]?.reason ?? '',
  }))
  return {
    ratio: snapshot.ratio,
    rawRatio: snapshot.rawRatio,
    stars: snapshot.ratio * RATING_STARS,
    earnedWeight: criteria.reduce((sum, c) => sum + criterionPoints(c), 0),
    totalWeight: criteria.reduce((sum, c) => sum + c.weight, 0),
    criteria,
    gates,
  }
}

export interface RatingVerdict {
  label: string
  tone: 'good' | 'caution' | 'bad'
}

/** A quick read on a 0..1 score. The bands are deliberately unforgiving — a setup that
 * half-meets everything is a no-trade, not a "good" one. Takes a bare ratio (not the full
 * `TradeRating`) so it also works wherever only a ratio is on hand. */
export function ratingVerdict(ratio: number): RatingVerdict {
  if (ratio >= 0.85) return { label: 'Excellent setup', tone: 'good' }
  if (ratio >= 0.7) return { label: 'Good setup', tone: 'good' }
  if (ratio >= 0.55) return { label: 'Marginal — tighten up', tone: 'caution' }
  return { label: 'Weak setup — don’t trade', tone: 'bad' }
}
