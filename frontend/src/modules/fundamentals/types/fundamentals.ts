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

/** One fiscal year's raw Balance Sheet figures for Debt to Equity, exactly as typed — same
 * "raw string, not parsed" rule as `QuarterFinancials`. Annual, not quarterly: a genuinely
 * different period axis from Code 33's `QuarterFinancials`, so it's never mixed into `quarters`. */
export interface DebtEquityYear {
  /** "YYYY" — a fiscal-year label, e.g. "2026". Generated from `debtEquityAsOfYear`/
   * `debtEquityYearCount`, never entered free-form (same rule `QuarterFinancials.period` follows). */
  year: string
  borrowings: string
  equityCapital: string
  reserves: string
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
