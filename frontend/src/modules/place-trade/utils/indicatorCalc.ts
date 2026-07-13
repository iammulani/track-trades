export interface IndicatorRangeCalc {
  aboveLowPercent: number | null
  belowHighPercent: number | null
}

function toNumber(value: string): number | null {
  const n = Number(value)
  return value.trim() !== '' && Number.isFinite(n) ? n : null
}

/** How far the entry price sits inside the 52-week range — recomputed live, never stored. */
export function computeIndicatorRange(
  entryPrice: string,
  week52Low: string,
  week52High: string,
): IndicatorRangeCalc {
  const entry = toNumber(entryPrice)
  const low = toNumber(week52Low)
  const high = toNumber(week52High)

  const aboveLowPercent = entry !== null && low !== null && low !== 0 ? ((entry - low) / low) * 100 : null
  const belowHighPercent =
    entry !== null && high !== null && high !== 0 ? ((high - entry) / high) * 100 : null

  return { aboveLowPercent, belowHighPercent }
}

/** How far the entry price sits from the 50-day MA — positive means above it, negative below. */
export function computeMaDistancePercent(entryPrice: string, fiftyDayMa: string): number | null {
  const entry = toNumber(entryPrice)
  const ma = toNumber(fiftyDayMa)
  return entry !== null && ma !== null && ma !== 0 ? ((entry - ma) / ma) * 100 : null
}

export type MaDistanceTone = 'good' | 'caution' | 'bad' | 'none'

/** How far above the 50-day MA the entry sits, read as *extension*: a tight entry hugs the MA
 * (support close, stop stays tight); a big gap means price has run past its base and you're
 * chasing. Good 0-5% above, caution 5-20% (or just below the MA), bad >20% (extended) or
 * well below it. Thresholds are deliberately loose — treat it as a nudge, not a gate. */
export function maDistanceTone(distancePercent: number | null): MaDistanceTone {
  if (distancePercent === null) return 'none'
  if (distancePercent >= 0 && distancePercent <= 5) return 'good'
  if (distancePercent > 5 && distancePercent <= 20) return 'caution'
  if (distancePercent < 0 && distancePercent >= -5) return 'caution'
  return 'bad'
}

export type RsRatingTone = 'good' | 'caution' | 'bad' | 'none'

/** The RS Rating is a 1-99 percentile of the stock's relative strength against the whole
 * market — not RSI(14). Guideline: it should be no less than 70, ideally in the 80s/90s. */
export function rsRatingTone(value: string): RsRatingTone {
  const n = Number(value)
  if (value.trim() === '' || !Number.isFinite(n)) return 'none'
  if (n >= 80) return 'good'
  if (n >= 70) return 'caution'
  return 'bad'
}
