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

export type RsiTone = 'good' | 'caution' | 'bad' | 'none'

/** Guideline: RSI should be no less than 70, ideally in the 80s/90s. */
export function rsiTone(value: string): RsiTone {
  const n = Number(value)
  if (value.trim() === '' || !Number.isFinite(n)) return 'none'
  if (n >= 80) return 'good'
  if (n >= 70) return 'caution'
  return 'bad'
}
