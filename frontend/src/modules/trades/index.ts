export type {
  Trade,
  TradeSide,
  TradeStatus,
  TradeOutcome,
  TradeMetrics,
  TradeWithMetrics,
  DashboardSummary,
} from './types/trade'
export { useTrades } from './hooks/useTrades'
export { buildEquitySeries } from './utils/equitySeries'
export type { EquityPoint } from './utils/equitySeries'
