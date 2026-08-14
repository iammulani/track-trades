/** One quarter's raw figures, exactly as typed — strings, not parsed numbers, same rule
 * `TradeParams` follows: resuming has to restore what you typed, not a re-rendering of it. */
export interface QuarterFinancials {
  /** "YYYY-MM" — the quarter's end month, e.g. "2026-06". Doubles as the row's identity;
   * periods are generated from `asOfPeriod`/`quarterCount`, never entered free-form. */
  period: string
  sales: string
  netProfit: string
  eps: string
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
  updatedAt: string
}

/** What creating a record writes — the timestamp is stamped by the API layer. */
export interface NewFundamentalsRecord {
  watchlistItemId: string
  asOfPeriod: string
  quarterCount: number
  quarters: QuarterFinancials[]
}
