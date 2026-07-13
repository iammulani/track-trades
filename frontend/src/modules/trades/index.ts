export type {
  Trade,
  TradeSide,
  TradeStatus,
  TradeOutcome,
  TradeStage,
  TradeBase,
  TradeChecklist,
  TradeVcpContraction,
  TradeSetup,
  TradeMetrics,
  TradeWithMetrics,
  DashboardSummary,
  NewTrade,
  ExitReason,
  ExitLearning,
  CloseTradeInput,
} from './types/trade'
export { useTrades } from './hooks/useTrades'
export { addTrade, closeTrade } from './api/tradesApi'
export { buildEquitySeries } from './utils/equitySeries'
export type { EquityPoint } from './utils/equitySeries'
export { computeExitPreview } from './utils/tradeMetrics'
export type { ExitPreview } from './utils/tradeMetrics'
export { EXIT_REASON_OPTIONS, MAX_EXIT_REASONS, exitReasonLabel } from './utils/exitReasons'
