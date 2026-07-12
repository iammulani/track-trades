import type { VcpContraction } from '../types/placeTrade'

export type VcpTone = 'good' | 'caution' | 'bad' | 'none'

function toNumber(value: string): number | null {
  const n = Number(value)
  return value.trim() !== '' && Number.isFinite(n) ? n : null
}

/** % pullback for one contraction (high -> low) — null until both sides are filled. */
export function computeContractionPercent(contraction: VcpContraction): number | null {
  const high = toNumber(contraction.high)
  const low = toNumber(contraction.low)
  if (high === null || low === null || high === 0) return null
  return ((high - low) / high) * 100
}

function isFilled(contraction: VcpContraction): boolean {
  return contraction.high.trim() !== '' && contraction.low.trim() !== ''
}

export function filledContractionCount(contractions: VcpContraction[]): number {
  return contractions.filter(isFilled).length
}

function filledPercents(contractions: VcpContraction[]): number[] {
  return contractions
    .map(computeContractionPercent)
    .filter((p): p is number => p !== null)
}

export function largestCorrectionPercent(contractions: VcpContraction[]): number | null {
  const percents = filledPercents(contractions)
  return percents.length ? Math.max(...percents) : null
}

export function narrowestPullbackPercent(contractions: VcpContraction[]): number | null {
  const percents = filledPercents(contractions)
  return percents.length ? Math.min(...percents) : null
}

function toneFromRange(value: number | null, goodMax: number, cautionMax: number): VcpTone {
  if (value === null) return 'none'
  if (value <= goodMax) return 'good'
  if (value <= cautionMax) return 'caution'
  return 'bad'
}

/** A textbook base runs 5-26 weeks — shorter hasn't shaken out weak holders yet, longer may be losing its edge. */
export function weeksInBaseTone(value: string): VcpTone {
  const n = toNumber(value)
  if (n === null) return 'none'
  if (n < 5) return 'bad'
  if (n <= 26) return 'good'
  return 'caution'
}

/** The deepest contraction of a proper VCP typically runs 25-35% off the high (and
 * can be more in a volatile market) — it's the *tightening* that matters, not a shallow
 * first leg. Good ≤35%, caution ≤50%, bad beyond. */
export function largestCorrectionTone(contractions: VcpContraction[]): VcpTone {
  return toneFromRange(largestCorrectionPercent(contractions), 35, 50)
}

/** The final, right-most contraction should be tight — the narrower, the closer to a proper pivot. */
export function narrowestPullbackTone(contractions: VcpContraction[]): VcpTone {
  return toneFromRange(narrowestPullbackPercent(contractions), 10, 15)
}

/** A healthy VCP shows 2-4 contractions, each tighter than the last. */
export function contractionCountTone(contractions: VcpContraction[]): VcpTone {
  const n = filledContractionCount(contractions)
  if (n < 2) return 'bad'
  if (n <= 4) return 'good'
  return 'caution'
}

/** The defining VCP property: does every filled contraction tighten (or hold) versus the one
 * before it? Needs at least two filled contractions to show a trend at all. Order is preserved;
 * unfilled rows are skipped rather than breaking the sequence. */
export function contractionsTightening(contractions: VcpContraction[]): boolean {
  const percents = contractions
    .map(computeContractionPercent)
    .filter((p): p is number => p !== null)
  if (percents.length < 2) return false
  return percents.every((p, i) => i === 0 || p <= percents[i - 1])
}

/** Is this contraction tighter than (or equal to) the one before it? The first has no baseline to compare. */
export function contractionTightnessTone(contractions: VcpContraction[], index: number): VcpTone {
  const percents = contractions.map(computeContractionPercent)
  const current = percents[index]
  if (current === null) return 'none'
  if (index === 0) return 'good'
  const previous = percents[index - 1]
  if (previous === null) return 'none'
  return current <= previous ? 'good' : 'bad'
}
