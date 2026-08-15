import type { QuarterFinancials } from '../types/fundamentals'

/** One quarter's Interest Coverage figures, parsed, plus the ratio derived from them. `ratio` is
 * `null` when there isn't enough data to say — a blank field, or `interest <= 0` (division by
 * zero reads as "not judgeable", not a misleading number). */
export interface InterestCoverageDerived {
  period: string
  operatingProfit: number | null
  interest: number | null
  ratio: number | null
}

export type InterestCoverageTone = 'good' | 'caution' | 'bad'

function toNumberOrNull(value: string | undefined): number | null {
  if (value === undefined) return null
  const n = Number(value)
  return value.trim() !== '' && Number.isFinite(n) ? n : null
}

/** Interest Coverage = Operating Profit ÷ Interest — can the business comfortably afford the
 * interest it owes? Purely a per-quarter read, no year-over-year comparison involved (same as
 * Debt to Equity), so each row derives independently. */
export function deriveInterestCoverage(quarters: QuarterFinancials[]): InterestCoverageDerived[] {
  return quarters.map((q) => {
    const operatingProfit = toNumberOrNull(q.operatingProfit)
    const interest = toNumberOrNull(q.interest)
    const ratio = operatingProfit !== null && interest !== null && interest > 0 ? operatingProfit / interest : null

    return { period: q.period, operatingProfit, interest, ratio }
  })
}

/** Fixed-threshold colour band, not a scored/weighted rating — same "safe / watch / fragile"
 * shape as Debt to Equity's `debtEquityTone()`, just with its own thresholds. */
export function interestCoverageTone(ratio: number | null): InterestCoverageTone | null {
  if (ratio === null) return null
  if (ratio > 5) return 'good'
  if (ratio >= 3) return 'caution'
  return 'bad'
}
