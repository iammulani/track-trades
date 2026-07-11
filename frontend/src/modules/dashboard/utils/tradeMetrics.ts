import type {
  DashboardSummary,
  Trade,
  TradeMetrics,
  TradeOutcome,
  TradeWithMetrics,
} from '../types/trade'

/** Derive per-trade metrics (P&L, return %, outcome, duration) from raw data. */
export function computeTradeMetrics(trade: Trade): TradeMetrics {
  const isClosed = trade.exitPrice !== null && trade.exitTime !== null

  const entryMs = new Date(trade.entryTime).getTime()
  const endMs = isClosed ? new Date(trade.exitTime as string).getTime() : Date.now()
  const durationMs = endMs - entryMs

  if (!isClosed) {
    return { status: 'open', pnl: null, pnlPercent: null, outcome: null, durationMs }
  }

  const exit = trade.exitPrice as number
  const direction = trade.side === 'long' ? 1 : -1
  const priceDelta = (exit - trade.entryPrice) * direction

  const pnl = priceDelta * trade.quantity
  const pnlPercent = (priceDelta / trade.entryPrice) * 100

  let outcome: TradeOutcome = 'breakeven'
  if (pnl > 0) outcome = 'win'
  else if (pnl < 0) outcome = 'loss'

  return { status: 'closed', pnl, pnlPercent, outcome, durationMs }
}

export function withMetrics(trade: Trade): TradeWithMetrics {
  return { ...trade, metrics: computeTradeMetrics(trade) }
}

/** Aggregate summary metrics across all trades. */
export function summarize(trades: TradeWithMetrics[]): DashboardSummary {
  const closed = trades.filter((t) => t.metrics.status === 'closed')

  const wins = closed.filter((t) => t.metrics.outcome === 'win').length
  const losses = closed.filter((t) => t.metrics.outcome === 'loss').length

  const netPnl = closed.reduce((sum, t) => sum + (t.metrics.pnl ?? 0), 0)

  const avgReturnPercent =
    closed.length === 0
      ? 0
      : closed.reduce((sum, t) => sum + (t.metrics.pnlPercent ?? 0), 0) / closed.length

  const avgDurationMs =
    closed.length === 0
      ? 0
      : closed.reduce((sum, t) => sum + t.metrics.durationMs, 0) / closed.length

  let bestTrade: TradeWithMetrics | null = null
  let worstTrade: TradeWithMetrics | null = null
  for (const t of closed) {
    const pnl = t.metrics.pnl ?? 0
    if (bestTrade === null || pnl > (bestTrade.metrics.pnl ?? 0)) bestTrade = t
    if (worstTrade === null || pnl < (worstTrade.metrics.pnl ?? 0)) worstTrade = t
  }

  return {
    totalTrades: trades.length,
    openTrades: trades.length - closed.length,
    closedTrades: closed.length,
    wins,
    losses,
    winRate: closed.length === 0 ? 0 : (wins / closed.length) * 100,
    netPnl,
    avgReturnPercent,
    avgDurationMs,
    bestTrade,
    worstTrade,
  }
}

/** Newest first, by entry time. */
export function sortByEntryDesc(trades: TradeWithMetrics[]): TradeWithMetrics[] {
  return [...trades].sort(
    (a, b) => new Date(b.entryTime).getTime() - new Date(a.entryTime).getTime(),
  )
}
