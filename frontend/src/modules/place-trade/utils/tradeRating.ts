import type { IconName } from '../../../shared/components/Icon'
import { formatPercent, formatPrice } from '../../../shared/utils/format'
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
import {
  BREAKOUT_CONFIRMATION_CHECKLIST_ITEMS,
  GATED_BREAKOUT_IDS,
  OVERHEAD_SUPPLY_CHECKLIST_ITEMS,
} from './finalChecksItems'
import { computeIndicatorRange, rsiTone } from './indicatorCalc'
import { INDICATOR_CHECKLIST_ITEMS } from './indicatorChecklistItems'
import { computeRisk } from './riskCalc'
import { BASE_OPTIONS, STAGE_OPTIONS } from './stageBaseOptions'
import {
  checkStopPlacement,
  MIN_RISK_PERCENT,
  stopPlacementScore,
  type StopPlacementCheck,
} from './stopPlacement'

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
  /** Short rule name — "Logical Stop" — for contexts that need to name the rule on its own,
   * e.g. the failed-gate banner's heading. */
  name: string
  /** What passing requires — "sits below the base, sized 2–10%". */
  description: string
  /** `name — description`, for contexts that just want one line (hover-card, non-negotiables list). */
  label: string
  state: GateState
  /** The highest ratio (0..1) the trade may score while this gate is failing. */
  cap: number
  /** Why the rule is non-negotiable — shown when it fails. */
  reason: string
  /** This trade's actual numbers plugged into the failure — "stop is 1,320, base low is
   * 1,304". Only computed live (see `computeTradeRating`); absent on a replayed snapshot,
   * which falls back to the generic `reason`. */
  detail?: string
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

/** Spells out the icon/color in words — so the verdict doesn't rely on color alone. */
export const CRITERION_STATE_LABEL: Record<CriterionState, string> = {
  met: 'Met',
  partial: 'Partial',
  unmet: 'Missed',
}

/** A pending gate reads as neutral, not as a failure — nothing has been entered to judge yet.
 * Shared by the badge hover-card and the Review/Trade Detail non-negotiables list. */
export const GATE_STATE_ICON: Record<GateState, IconName> = {
  pass: 'check',
  fail: 'x',
  pending: 'alert',
}

export const GATE_STATE_LABEL: Record<GateState, string> = {
  pass: 'Met',
  fail: 'Not met',
  pending: 'Pending',
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
const GATE_META: Record<string, { name: string; description: string; cap: number; reason: string }> = {
  'stage-2': {
    name: 'Stage 2',
    description: 'the stock is in a confirmed advance',
    cap: 0.4,
    reason:
      "Only Stage 2 is worth trading — Stage 1, 3, and 4 (and an unproven 1→2 transition) all mean fighting the trend, no matter how good everything else looks.",
  },
  'trend-template': {
    name: 'Trend Template',
    description: 'MA structure, ≥30% off the low, within 25% of the high',
    cap: 0.6,
    reason:
      "The moving averages need to be stacked and rising, price well clear of its 52-week low (30%+), and close to its high (within 25%). Miss any of those and it's not a market leader yet.",
  },
  'logical-stop': {
    name: 'Logical Stop',
    description: 'sits below the base, sized 2–10%',
    cap: 0.6,
    reason:
      "The stop should sit just below the base's last low. Any tighter and ordinary noise stops you out for no reason; any further than 10% away and the position is oversized.",
  },
  'real-base': {
    name: 'Real Base',
    description: '5+ weeks, 2+ contractions, tightening',
    cap: 0.6,
    reason:
      "A real base needs 5+ weeks, at least 2 pullbacks, and each one tighter than the last. Without that, it's just a pause, not a base — there's no pivot to buy yet.",
  },
  'breakout-confirmation': {
    name: 'Breakout Confirmation',
    description: 'market bullish, industry group positive, volume confirms the move',
    cap: 0.6,
    reason:
      "A breakout without the market, the industry group, and volume behind it is a hopeful guess, not a confirmed move — any one of those being wrong meaningfully raises the odds it fails.",
  },
}

function gateLabel(meta: { name: string; description: string }): string {
  return `${meta.name} — ${meta.description}`
}

function toNumberOrNull(value: string): number | null {
  const n = Number(value)
  return value.trim() !== '' && Number.isFinite(n) ? n : null
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function stageGateDetail(stage: { label: string; verdict: string } | undefined): string | undefined {
  if (!stage) return undefined
  return `You picked ${stage.label} (${stage.verdict}) — only Stage 2 passes.`
}

function trendTemplateDetail(
  checklistOk: boolean,
  checkedCount: number,
  totalChecks: number,
  aboveLowOk: boolean | null,
  aboveLowPercent: number | null,
  belowHighOk: boolean | null,
  belowHighPercent: number | null,
): string | undefined {
  const parts: string[] = []
  if (!checklistOk) parts.push(`only ${checkedCount} of ${totalChecks} MA checks ticked`)
  if (aboveLowOk === false && aboveLowPercent !== null) {
    parts.push(`${formatPercent(aboveLowPercent)} off its 52-week low (needs 30%+)`)
  }
  if (belowHighOk === false && belowHighPercent !== null) {
    parts.push(`${formatPercent(belowHighPercent)} below its 52-week high (needs ≤25%)`)
  }
  return parts.length === 0 ? undefined : `${capitalize(parts.join('; '))}.`
}

function logicalStopDetail(
  side: WatchSide,
  stopLoss: number | null,
  check: StopPlacementCheck,
): string | undefined {
  const parts: string[] = []
  if (check.beyondBase === false && check.supportLevel !== null && stopLoss !== null) {
    const relation = side === 'long' ? 'above' : 'below'
    const need = side === 'long' ? 'at or below' : 'at or above'
    const extreme = side === 'long' ? 'low' : 'high'
    parts.push(
      `your stop (${formatPrice(stopLoss)}) is ${relation} the base's last ${extreme} (${formatPrice(check.supportLevel)}) — it needs to sit ${need} that`,
    )
  }
  if (check.sizeOk === false && check.riskPercent !== null) {
    const sizing = check.riskPercent < MIN_RISK_PERCENT ? 'too tight' : 'too wide'
    parts.push(`risking ${formatPercent(check.riskPercent)} is ${sizing} — needs 2–10%`)
  }
  return parts.length === 0 ? undefined : `${capitalize(parts.join('; '))}.`
}

function realBaseDetail(
  hasWeeksInBase: boolean,
  weeksInBase: number,
  filledCount: number,
  tightening: boolean,
): string | undefined {
  const parts: string[] = []
  if (filledCount > 0 && hasWeeksInBase && weeksInBase < 5) {
    parts.push(`only ${weeksInBase} week${weeksInBase === 1 ? '' : 's'} in base (needs 5+)`)
  }
  if (filledCount > 0 && filledCount < 2) {
    parts.push(`only ${filledCount} contraction${filledCount === 1 ? '' : 's'} filled (needs 2+)`)
  }
  if (filledCount > 0 && !tightening) {
    parts.push("contractions aren't tightening")
  }
  return parts.length === 0 ? undefined : `${capitalize(parts.join('; '))}.`
}

function breakoutConfirmationDetail(checked: ChecklistChecked): string | undefined {
  const parts: string[] = []
  if (checked['market-bullish'] === false) parts.push("the market isn't bullish")
  if (checked['group-positive'] === false) parts.push("the industry group isn't acting positively")
  if (checked['volume-confirms-breakout'] === false) parts.push("volume doesn't confirm the breakout")
  return parts.length === 0 ? undefined : `${capitalize(parts.join('; '))}.`
}

/** Each criterion's wording, keyed by the id that gets persisted — same deal as `GATE_META`. */
const CRITERION_LABELS: Record<string, string> = {
  'risk-reward': "You'll make at least twice what you're risking (2:1 or better)",
  'stop-placement': 'Stop is below the base (half credit) AND sized 2–10% risk (half credit)',
  'stage-quality': "The stock's in a good stage to trade",
  'base-quality': 'The base looks well-formed',
  'ma-trend': "Moving averages are lined up in a healthy uptrend",
  'relative-strength': 'RSI is strong — 70 or higher, ideally in the 80s or 90s',
  // No longer produced by computeTradeRating — the 50-day MA is now a display-only warning
  // (TechnicalConfirmationStep), not a scored criterion. Kept here so trades rated before this
  // change still render their frozen 'ma-proximity' line correctly (see fromRatingSnapshot).
  'ma-proximity': "Entry is close to the 50-day MA, not extended",
  'week-range': "Price is well clear of its 52-week low and close to its high",
  'vcp-structure': "The base's shape — time, price, and tightening — looks textbook",
  'final-checks': "There's no overhead resistance sitting above the entry",
}

function gate(id: string, state: GateState, detail?: string): RatingGate {
  const meta = GATE_META[id]
  return {
    id,
    name: meta.name,
    description: meta.description,
    label: gateLabel(meta),
    state,
    cap: meta.cap,
    reason: meta.reason,
    detail: state === 'fail' ? detail : undefined,
  }
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
  const trendChecklistOk = allChecked(INDICATOR_CHECKLIST_ITEMS, indicatorChecklistChecked)
  const trendCheckedCount = INDICATOR_CHECKLIST_ITEMS.filter(
    (item) => indicatorChecklistChecked[item.id],
  ).length
  const tightening = contractionsTightening(contractions)

  const gates: RatingGate[] = [
    gate(
      'stage-2',
      gateState([stageBaseAnswers.stage === null ? null : stageBaseAnswers.stage === 'stage-2']),
      stageGateDetail(stage),
    ),
    gate(
      'trend-template',
      gateState([
        range.aboveLowPercent === null || range.belowHighPercent === null ? null : trendChecklistOk,
        aboveLowOk,
        belowHighOk,
      ]),
      trendTemplateDetail(
        trendChecklistOk,
        trendCheckedCount,
        INDICATOR_CHECKLIST_ITEMS.length,
        aboveLowOk,
        range.aboveLowPercent,
        belowHighOk,
        range.belowHighPercent,
      ),
    ),
    gate(
      'logical-stop',
      gateState([stop.beyondBase, stop.sizeOk]),
      logicalStopDetail(side, toNumberOrNull(tradeParams.stopLoss), stop),
    ),
    gate(
      'real-base',
      gateState([
        !hasWeeksInBase || filledCount === 0 ? null : weeksInBase >= 5,
        filledCount === 0 ? null : filledCount >= 2,
        filledCount === 0 ? null : tightening,
      ]),
      realBaseDetail(hasWeeksInBase, weeksInBase, filledCount, tightening),
    ),
    gate(
      'breakout-confirmation',
      gateState(
        GATED_BREAKOUT_IDS.map((id) => (finalChecksChecked[id] === undefined ? null : finalChecksChecked[id])),
      ),
      breakoutConfirmationDetail(finalChecksChecked),
    ),
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
    tightening,
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
    // The 3 breakout-momentum checks (market/group/volume) are gated above, not scored here —
    // only the overhead-supply side (plus the remaining "minimal resistance" check) is soft.
    criterion(
      'final-checks',
      1,
      fractionChecked(
        [
          ...OVERHEAD_SUPPLY_CHECKLIST_ITEMS,
          ...BREAKOUT_CONFIRMATION_CHECKLIST_ITEMS.filter((item) => !GATED_BREAKOUT_IDS.includes(item.id)),
        ],
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
  const gates: RatingGate[] = snapshot.gates.map((g) => {
    const meta = GATE_META[g.id]
    return {
      id: g.id,
      name: meta?.name ?? g.id,
      description: meta?.description ?? '',
      label: meta ? gateLabel(meta) : g.id,
      state: g.state,
      cap: g.cap,
      reason: meta?.reason ?? '',
    }
  })
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
