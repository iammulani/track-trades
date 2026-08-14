/**
 * `quarterCount` quarter periods stepping back 3 months at a time from `asOfPeriod`
 * (inclusive), oldest first. `asOfPeriod` is the most recent quarter being evaluated — it can
 * be today's latest reported quarter, or a past one, so a stock's fundamentals can be checked
 * as they stood on any date, not only the present. No manual add/remove-row entry — the grid
 * is regenerated from these two controls; "show more history" just raises `quarterCount`.
 */
export function generateQuarterPeriods(asOfPeriod: string, quarterCount: number): string[] {
  if (!asOfPeriod || quarterCount <= 0) return []
  const [asOfYear, asOfMonth] = asOfPeriod.split('-').map(Number)
  if (!Number.isFinite(asOfYear) || !Number.isFinite(asOfMonth)) return []

  const asOfIndex = asOfYear * 12 + (asOfMonth - 1)
  const periods: string[] = []
  for (let i = quarterCount - 1; i >= 0; i--) {
    const index = asOfIndex - i * 3
    const year = Math.floor(index / 12)
    const month = (index % 12) + 1
    periods.push(`${year}-${String(month).padStart(2, '0')}`)
  }
  return periods
}
