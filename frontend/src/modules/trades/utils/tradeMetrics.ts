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

export interface ExitPreview {
  pnl: number | null
  pnlPercent: number | null
  /** Realized R-multiple: gain/loss per share versus the planned risk per share
   * (entry − stop, direction-adjusted). null with no stop, or a non-risk-reducing one. */
  riskRewardRatio: number | null
}

/** What closing at `exitPriceInput` would realize — live while typing (a string, may be
 * incomplete) and reused as-is once saved, by passing the stored exit price back in.
 * Never stored itself. `stopLoss` comes from the trade's `setup`, if any. */
export function computeExitPreview(
  trade: Pick<Trade, 'side' | 'entryPrice' | 'quantity'>,
  exitPriceInput: string,
  stopLoss: number | null,
): ExitPreview {
  const exit = Number(exitPriceInput)
  if (exitPriceInput.trim() === '' || !Number.isFinite(exit)) {
    return { pnl: null, pnlPercent: null, riskRewardRatio: null }
  }

  const direction = trade.side === 'long' ? 1 : -1
  const pnlPerShare = (exit - trade.entryPrice) * direction
  const pnl = pnlPerShare * trade.quantity
  const pnlPercent = (pnlPerShare / trade.entryPrice) * 100

  let riskRewardRatio: number | null = null
  if (stopLoss !== null) {
    const riskPerShare = (trade.entryPrice - stopLoss) * direction
    if (riskPerShare > 0) riskRewardRatio = pnlPerShare / riskPerShare
  }

  return { pnl, pnlPercent, riskRewardRatio }
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
