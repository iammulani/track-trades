import type { DebtEquityYear } from '../types/fundamentals'

/** One fiscal year's Cash Conversion figures, parsed, plus what's derived from them. `ratio` and
 * `selfFunded` are `null` when there isn't enough data to say. */
export interface CashConversionDerived {
  year: string
  cashFromOperatingActivity: number | null
  cashFromInvestingActivity: number | null
  cashFromFinancingActivity: number | null
  netProfit: number | null
  /** Cash from Operating Activity ÷ Net Profit — is the reported profit turning into real money?
   * `null` if `netProfit <= 0` (a loss-making or break-even year makes the ratio meaningless) or
   * either input is blank. */
  ratio: number | null
  /** The "bonus flag": does operating cash alone cover what the business spent on investing
   * (capex), without needing outside financing? `cashFromOperatingActivity +
   * cashFromInvestingActivity > 0` — see `DebtEquityYear.cashFromInvestingActivity` for why it's
   * added rather than subtracted. `null` if either input is blank. */
  selfFunded: boolean | null
}

export type CashConversionTone = 'good' | 'caution' | 'bad'

function toNumberOrNull(value: string | undefined): number | null {
  if (value === undefined) return null
  const n = Number(value)
  return value.trim() !== '' && Number.isFinite(n) ? n : null
}

/** Cash Conversion = Cash from Operating Activity ÷ Net Profit, plus the Self-Funded bonus flag —
 * both read off the same three Cash Flow inputs, so they're derived together. Purely a per-year
 * read, no year-over-year comparison, same as Debt to Equity. */
export function deriveCashConversion(years: DebtEquityYear[]): CashConversionDerived[] {
  return years.map((y) => {
    const cashFromOperatingActivity = toNumberOrNull(y.cashFromOperatingActivity)
    const cashFromInvestingActivity = toNumberOrNull(y.cashFromInvestingActivity)
    const cashFromFinancingActivity = toNumberOrNull(y.cashFromFinancingActivity)
    const netProfit = toNumberOrNull(y.netProfit)

    const ratio =
      cashFromOperatingActivity !== null && netProfit !== null && netProfit > 0
        ? cashFromOperatingActivity / netProfit
        : null

    const selfFunded =
      cashFromOperatingActivity !== null && cashFromInvestingActivity !== null
        ? cashFromOperatingActivity + cashFromInvestingActivity > 0
        : null

    return {
      year: y.year,
      cashFromOperatingActivity,
      cashFromInvestingActivity,
      cashFromFinancingActivity,
      netProfit,
      ratio,
      selfFunded,
    }
  })
}

/** Fixed-threshold colour band, not a scored/weighted rating — same "safe / watch / fragile"
 * shape as `debtEquityTone()`/`interestCoverageTone()`. A single low year can be timing (an
 * unpaid invoice at year-end); the band is a per-year read, the "investigate" judgement is really
 * about seeing it repeat across years (see `CashConversionExplainer`). */
export function cashConversionTone(ratio: number | null): CashConversionTone | null {
  if (ratio === null) return null
  if (ratio > 1.0) return 'good'
  if (ratio >= 0.7) return 'caution'
  return 'bad'
}
