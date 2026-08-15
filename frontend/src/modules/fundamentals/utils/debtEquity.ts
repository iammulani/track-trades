import type { DebtEquityYear } from '../types/fundamentals'

/** One fiscal year's Debt to Equity figures, parsed, plus the ratio derived from them. `ratio` is
 * `null` when there isn't enough data to say — a blank field, or `equityCapital + reserves <= 0`
 * (division by zero or a negative-equity year reads as "not judgeable", not a misleading number). */
export interface DebtEquityDerived {
  year: string
  borrowings: number | null
  equityCapital: number | null
  reserves: number | null
  ratio: number | null
}

export type DebtEquityTone = 'good' | 'caution' | 'bad'

function toNumberOrNull(value: string): number | null {
  const n = Number(value)
  return value.trim() !== '' && Number.isFinite(n) ? n : null
}

/** Debt/Equity = Borrowings ÷ (Equity Capital + Reserves) — how much of the business was funded
 * by borrowed money vs. the owners' own capital. Purely a per-year read, no year-over-year
 * comparison involved (unlike Code 33's YoY growth), so each row derives independently. */
export function deriveDebtEquity(years: DebtEquityYear[]): DebtEquityDerived[] {
  return years.map((y) => {
    const borrowings = toNumberOrNull(y.borrowings)
    const equityCapital = toNumberOrNull(y.equityCapital)
    const reserves = toNumberOrNull(y.reserves)
    const equityBase =
      equityCapital !== null && reserves !== null ? equityCapital + reserves : null
    const ratio = borrowings !== null && equityBase !== null && equityBase > 0 ? borrowings / equityBase : null

    return { year: y.year, borrowings, equityCapital, reserves, ratio }
  })
}

/** Fixed-threshold colour band, not a scored/weighted rating — Debt to Equity is read as "safe /
 * watch / fragile" against thresholds a trader picks once, not accumulated across steps the way
 * Code 33's `metricTone()` bands a hit ratio. */
export function debtEquityTone(ratio: number | null): DebtEquityTone | null {
  if (ratio === null) return null
  if (ratio < 0.5) return 'good'
  if (ratio <= 1.0) return 'caution'
  return 'bad'
}
