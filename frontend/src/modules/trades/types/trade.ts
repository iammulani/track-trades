export type TradeSide = 'long' | 'short'
export type TradeStatus = 'open' | 'closed'
export type TradeOutcome = 'win' | 'loss' | 'breakeven'

/** Raw trade as stored in db.json. */
export interface Trade {
  id: string
  symbol: string
  side: TradeSide
  quantity: number
  entryPrice: number
  exitPrice: number | null
  entryTime: string
  exitTime: string | null
  notes?: string
}

/** Values derived from a single trade (see tradeMetrics.ts). */
export interface TradeMetrics {
  status: TradeStatus
  pnl: number | null
  pnlPercent: number | null
  outcome: TradeOutcome | null
  durationMs: number
}

/** A trade paired with its derived metrics — what the UI consumes. */
export interface TradeWithMetrics extends Trade {
  metrics: TradeMetrics
}

/** Aggregate metrics across all trades. */
export interface DashboardSummary {
  totalTrades: number
  openTrades: number
  closedTrades: number
  wins: number
  losses: number
  winRate: number
  netPnl: number
  avgReturnPercent: number
  avgDurationMs: number
  bestTrade: TradeWithMetrics | null
  worstTrade: TradeWithMetrics | null
}

/** A newly-placed trade — always opens with no exit yet. */
export interface NewTrade {
  symbol: string
  side: TradeSide
  quantity: number
  entryPrice: number
  entryTime: string
  notes?: string
}
