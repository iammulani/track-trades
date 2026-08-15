/** One quarter's raw figures, exactly as typed — strings, not parsed numbers, same rule
 * `TradeParams` follows: resuming has to restore what you typed, not a re-rendering of it. */
export interface QuarterFinancials {
  /** "YYYY-MM" — the quarter's end month, e.g. "2026-06". Doubles as the row's identity;
   * periods are generated from `asOfPeriod`/`quarterCount`, never entered free-form. */
  period: string
  sales: string
  netProfit: string
  eps: string
  /** Interest Coverage's two inputs — optional because they were added after `quarters` already
   * had live records; a quarter saved before this existed simply lacks the keys. Normalized to
   * `''` wherever a quarter is seeded into an editable grid, same as any other blank cell. */
  operatingProfit?: string
  interest?: string
}

/** One fiscal year's raw annual figures, exactly as typed — same "raw string, not parsed" rule as
 * `QuarterFinancials`. Annual, not quarterly: a genuinely different period axis from Code 33's
 * `QuarterFinancials`, so it's never mixed into `quarters`. Holds every annual-cadence metric's
 * inputs — Debt to Equity's Balance Sheet fields and Cash Conversion's Cash Flow fields — since
 * they're read off the same fiscal-year list on the source site. Still named for the first metric
 * that used it (and `FundamentalsRecord.debtEquityYears` below keeps that name too) rather than
 * renamed to something generic like `AnnualFinancials` — real records already persist under the
 * `debtEquityYears` key, and renaming it would risk orphaning that data on read, the same failure
 * mode already hit once with the Debt to Equity/Interest Coverage optional-field additions. */
export interface DebtEquityYear {
  /** "YYYY" — a fiscal-year label, e.g. "2026". Generated from `debtEquityAsOfYear`/
   * `debtEquityYearCount`, never entered free-form (same rule `QuarterFinancials.period` follows). */
  year: string
  // Debt to Equity (Balance Sheet)
  borrowings: string
  equityCapital: string
  reserves: string
  // Cash Conversion (Cash Flow) — optional, added after `debtEquityYears` already had live
  // records, same "added later" story as QuarterFinancials.operatingProfit/interest.
  cashFromOperatingActivity?: string
  /** Typed as reported on the source site — usually negative when it's an outflow (capex). The
   * Self-Funded flag reads it at face value (`cashFromOperatingActivity + cashFromInvestingActivity
   * > 0`), not as a separately-signed "capex" number, so a positive investing figure (net
   * divestment) correctly never fails the flag. */
  cashFromInvestingActivity?: string
  cashFromFinancingActivity?: string
  /** The year's total Net Profit — sum of 4 quarters, captured directly rather than summed from
   * Code 33's quarterly `netProfit` (that may not be fully entered for the same year). */
  netProfit?: string
}

/** Quarterly fundamentals captured for one watchlist item, as stored in db.json. */
export interface FundamentalsRecord {
  id: string
  watchlistItemId: string
  /** "YYYY-MM" — the most recent quarter being evaluated. Anchors the grid so a stock can be
   * judged as it stood on any date — "today" for a current watch, or a past date to check
   * fundamentals against an old trade — not just the present. */
  asOfPeriod: string
  /** How many trailing quarters (stepping back from `asOfPeriod`) the grid shows. Starts at 4;
   * grows when the user asks for more history. */
  quarterCount: number
  /** Sparse — only quarters with at least one value entered. */
  quarters: QuarterFinancials[]
  /** "YYYY" — the most recent fiscal year the Debt to Equity grid is evaluating. Same anchoring
   * idea as `asOfPeriod`, just on an annual axis. */
  debtEquityAsOfYear?: string
  /** How many trailing years (stepping back from `debtEquityAsOfYear`) the grid shows. Starts at 7. */
  debtEquityYearCount?: number
  /** Sparse — only years with at least one value entered. */
  debtEquityYears?: DebtEquityYear[]
  updatedAt: string
}

/** What creating a record writes — the timestamp is stamped by the API layer. */
export interface NewFundamentalsRecord {
  watchlistItemId: string
  asOfPeriod: string
  quarterCount: number
  quarters: QuarterFinancials[]
  debtEquityAsOfYear?: string
  debtEquityYearCount?: number
  debtEquityYears?: DebtEquityYear[]
}
