import type { TradeParams, VcpContraction } from '../../drafts'
import type { WatchSide } from '../../watchlist'

/** Mirrors `place-trade/utils/stageBaseOptions.ts`'s `STAGE_OPTIONS`/`BASE_OPTIONS` labels
 * (just the label, not the risk-tone/verdict/detail prose — that's live-judgement content,
 * not appropriate for a frozen archive view). Duplicated rather than imported: importing
 * from `place-trade` here would cycle back through `place-trade -> watchlist ->
 * exited-watchlist`. These 9 short strings are effectively fixed reference vocabulary
 * (Minervini's stage/base terms), not app logic likely to drift. */
const STAGE_LABELS: Record<string, string> = {
  'stage-1': 'Stage 1',
  'transition-1-2': 'Transitioning 1 → 2',
  'stage-2': 'Stage 2',
  'stage-3': 'Stage 3',
  'stage-4': 'Stage 4',
}

const BASE_LABELS: Record<string, string> = {
  'base-1': 'Base 1',
  'base-2': 'Base 2',
  'base-3': 'Base 3',
  'base-4': 'Base 4',
}

export function stageLabel(stage: string | null): string | null {
  return stage ? (STAGE_LABELS[stage] ?? stage) : null
}

export function baseLabel(base: string | null): string | null {
  return base ? (BASE_LABELS[base] ?? base) : null
}

/** Mirrors `place-trade/PlaceTradePage.tsx`'s `STEPS` — id, title and 0-based index, so a
 * section only renders once the draft actually reached it (`draft.stepIndex >= index`)
 * instead of showing a wall of empty fields for steps that were never filled in. */
export const DRAFT_STEPS = [
  { id: 'setup', title: 'Trade Setup' },
  { id: 'stage-base', title: 'Stage & Base' },
  { id: 'technical', title: 'Technical Confirmation' },
  { id: 'week-range', title: '52-Week Range' },
  { id: 'vcp-structure', title: 'VCP Structure' },
  { id: 'final-checks', title: 'Final Checks' },
  { id: 'review', title: 'Review & Place' },
]

/** Mirrors `place-trade/utils/indicatorChecklistItems.ts` / `finalChecksItems.ts` — the
 * actual checklist wording, not just a count, so "what was confirmed" reads back the same
 * way it did live. Same duplication reasoning as the labels above. */
export const INDICATOR_CHECKLIST_ITEMS = [
  { id: 'ma-uptrend', label: '50, 150 & 200 day (10, 30, 40 week) MAs are in an uptrend' },
  {
    id: 'ma-stacked',
    label:
      '50 day MA is above the 150 day MA, and the 150 day MA is above the 200 day MA — true on both daily and weekly charts',
  },
  {
    id: 'ma200-duration',
    label: 'The 200 day MA is trending up for at least 1 month (preferably 4-5 months)',
  },
]

export const OVERHEAD_SUPPLY_CHECKLIST_ITEMS = [
  {
    id: 'volume-price-quiet',
    label: 'Volume and price action have quieted down noticeably on the right side of the base',
  },
  {
    id: 'weak-holders-shaken-out',
    label: "Enough time has passed for weak holders to be shaken out — this isn't a crowded trade",
  },
]

export const BREAKOUT_CONFIRMATION_CHECKLIST_ITEMS = [
  { id: 'market-bullish', label: 'The overall market trend is bullish' },
  { id: 'group-positive', label: "The stock's industry group is acting positively" },
  {
    id: 'volume-confirms-breakout',
    label: 'Volume confirms the breakout — noticeably higher than average',
  },
  {
    id: 'minimal-overhead-resistance',
    label: 'There is minimal resistance overhead that could cap the move',
  },
]

/** Mirrors `place-trade/utils/finalChecksCalc.ts`'s pure arithmetic (no risk-tone judgement
 * attached) — duplicated for the same cycle-avoidance reason as the labels above. */
export function computeWeeksInBase(startDate: string, endDate: string): number | null {
  if (!startDate || !endDate) return null
  const start = new Date(startDate)
  const end = new Date(endDate)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null
  const diffMs = end.getTime() - start.getTime()
  if (diffMs < 0) return null
  return Math.round(diffMs / (7 * 24 * 60 * 60 * 1000))
}

export function computeContractionPercent(contraction: VcpContraction): number | null {
  const high = Number(contraction.high)
  const low = Number(contraction.low)
  if (contraction.high.trim() === '' || contraction.low.trim() === '') return null
  if (!Number.isFinite(high) || !Number.isFinite(low) || high === 0) return null
  return ((high - low) / high) * 100
}

export interface ExitedRiskCalc {
  riskPerShare: number | null
  rewardPerShare: number | null
  riskAmount: number | null
  rewardAmount: number | null
  riskRewardRatio: number | null
  riskPercent: number | null
  rewardPercent: number | null
}

function toNumber(value: string): number | null {
  const n = Number(value)
  return value.trim() !== '' && Number.isFinite(n) ? n : null
}

/** Mirrors `place-trade/utils/riskCalc.ts`'s `computeRisk` — same duplication reasoning as
 * the rest of this file. The single most useful number missing from a bare "what was typed"
 * dump: what this setup's risk actually was, even though it was never placed. */
export function computeRisk(side: WatchSide, params: TradeParams): ExitedRiskCalc {
  const entry = toNumber(params.entryPrice)
  const stop = toNumber(params.stopLoss)
  const target = toNumber(params.target)
  const qty = toNumber(params.quantity)
  const direction = side === 'long' ? 1 : -1

  const riskPerShare = entry !== null && stop !== null ? (entry - stop) * direction : null
  const rewardPerShare = entry !== null && target !== null ? (target - entry) * direction : null

  const riskAmount = riskPerShare !== null && qty !== null ? riskPerShare * qty : null
  const rewardAmount = rewardPerShare !== null && qty !== null ? rewardPerShare * qty : null

  const riskRewardRatio =
    riskPerShare !== null && rewardPerShare !== null && riskPerShare > 0
      ? rewardPerShare / riskPerShare
      : null

  const riskPercent =
    riskPerShare !== null && entry !== null && entry !== 0 ? (riskPerShare / entry) * 100 : null
  const rewardPercent =
    rewardPerShare !== null && entry !== null && entry !== 0
      ? (rewardPerShare / entry) * 100
      : null

  return { riskPerShare, rewardPerShare, riskAmount, rewardAmount, riskRewardRatio, riskPercent, rewardPercent }
}

/** "1:4.8" when reward is bigger, "2:1" when risk is — flips so the smaller side always
 * reads as "1" rather than a sub-1 ratio that reads as an afterthought. Mirrors
 * `place-trade/components/RiskSummary.tsx`'s `formatRatio`. */
export function formatRiskRewardRatio(ratio: number | null): string {
  if (ratio === null || ratio <= 0) return '—'
  if (ratio >= 1) return `1:${ratio.toFixed(1)}`
  return `${(1 / ratio).toFixed(1)}:1`
}
