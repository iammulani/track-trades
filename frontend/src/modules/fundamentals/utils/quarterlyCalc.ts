import type { QuarterFinancials } from '../types/fundamentals'

/** One quarter's figures, parsed, plus everything derived from them. `null` means
 * "not enough data to say" — an unfilled field, or no same-quarter-prior-year row yet. */
export interface QuarterDerived {
  period: string
  sales: number | null
  netProfit: number | null
  eps: number | null
  netMargin: number | null
  salesGrowthYoY: number | null
  epsGrowthYoY: number | null
}

function toNumberOrNull(value: string): number | null {
  const n = Number(value)
  return value.trim() !== '' && Number.isFinite(n) ? n : null
}

/** "2026-06" -> "2025-06" — the quarter exactly one year earlier. */
export function priorYearPeriod(period: string): string {
  const [year, month] = period.split('-')
  return `${Number(year) - 1}-${month}`
}

/** "2026-06" -> "Jun 2026" — matches the screener.in-style label the user reads figures off. */
export function formatPeriodLabel(period: string): string {
  const [year, month] = period.split('-').map(Number)
  return new Date(year, month - 1, 1).toLocaleString('en-US', { month: 'short', year: 'numeric' })
}

/**
 * Derives net margin and year-over-year EPS/Sales growth for every quarter. YoY growth is
 * looked up by exact period match against the *same list* — never approximated from whatever
 * row sits a few positions away — so a quarter with no same-quarter-prior-year row simply
 * reads `null` rather than a guessed number.
 */
export function deriveQuarters(quarters: QuarterFinancials[]): QuarterDerived[] {
  const byPeriod = new Map(quarters.map((q) => [q.period, q]))

  return quarters.map((q) => {
    const sales = toNumberOrNull(q.sales)
    const netProfit = toNumberOrNull(q.netProfit)
    const eps = toNumberOrNull(q.eps)
    const netMargin = sales !== null && sales > 0 && netProfit !== null ? (netProfit / sales) * 100 : null

    const prior = byPeriod.get(priorYearPeriod(q.period))
    const priorSales = prior ? toNumberOrNull(prior.sales) : null
    const priorEps = prior ? toNumberOrNull(prior.eps) : null

    const salesGrowthYoY =
      sales !== null && priorSales !== null && priorSales > 0
        ? ((sales - priorSales) / priorSales) * 100
        : null
    // Guarded against abs(priorEps) rather than priorEps itself — a prior-year loss (negative
    // EPS) flipping the sign of the division would otherwise misread a recovery as a decline.
    const epsGrowthYoY =
      eps !== null && priorEps !== null && priorEps !== 0
        ? ((eps - priorEps) / Math.abs(priorEps)) * 100
        : null

    return { period: q.period, sales, netProfit, eps, netMargin, salesGrowthYoY, epsGrowthYoY }
  })
}
