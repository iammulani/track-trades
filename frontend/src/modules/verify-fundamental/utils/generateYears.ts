/**
 * `yearCount` fiscal-year periods stepping back one year at a time from `asOfYear` (inclusive),
 * oldest first. Annual analogue of `generateQuarterPeriods` — no quarter-end resolution needed,
 * a year is already a real reporting period on its own.
 */
export function generateYearPeriods(asOfYear: string, yearCount: number): string[] {
  if (!asOfYear || yearCount <= 0) return []
  const asOf = Number(asOfYear)
  if (!Number.isFinite(asOf)) return []

  const years: string[] = []
  for (let i = yearCount - 1; i >= 0; i--) {
    years.push(String(asOf - i))
  }
  return years
}
