# Trades domain — Spec

## Purpose

The shared data layer: fetching trades and deriving every metric from them
(P&L, win rate, return %, hold duration, equity curve). Not a page — a domain
module that feature pages (`dashboard`, `equity`) consume. Nothing here is
persisted beyond the raw fields; everything else is computed on read.

## Data

- **Source:** `GET /api/trades` → the `trades` resource in `backend/db.json`.
- **Raw shape** (`types/trade.ts`):

  | field        | type                 | meaning                                  |
  | ------------ | -------------------- | ---------------------------------------- |
  | `id`         | string               | unique id                                |
  | `symbol`     | string               | ticker (e.g. `AAPL`)                     |
  | `side`       | `"long" \| "short"`  | direction of the trade                   |
  | `quantity`   | number               | shares/contracts                         |
  | `entryPrice` | number               | fill price on entry                      |
  | `exitPrice`  | number \| null       | fill price on exit (`null` = still open) |
  | `entryTime`  | string (ISO)         | when the trade was entered               |
  | `exitTime`   | string \| null (ISO) | when it was exited (`null` = still open) |
  | `notes`      | string?              | free text                                |

- **Derived — per trade** (`utils/tradeMetrics.ts`):
  - `status`: `closed` if `exitPrice` and `exitTime` are set, else `open`.
  - `pnl`: long → `(exit − entry) × qty`; short → `(entry − exit) × qty`. `null` if open.
  - `pnlPercent`: long → `(exit − entry) / entry × 100`; short → `(entry − exit) / entry × 100`.
  - `outcome`: `win` if `pnl > 0`, `loss` if `pnl < 0`, `breakeven` if `0`, `null` if open.
  - `durationMs`: `exitTime − entryTime` (for open trades, `now − entryTime`).

- **Derived — summary across all trades** (`utils/tradeMetrics.ts`):
  - `totalTrades`, `openTrades`, `closedTrades`
  - `wins`, `losses`
  - `winRate` = `wins / closedTrades × 100`
  - `netPnl` = sum of closed-trade `pnl`
  - `avgReturnPercent` = mean `pnlPercent` of closed trades
  - `avgDurationMs` = mean `durationMs` of closed trades
  - `bestTrade` / `worstTrade` by `pnl`

- **Derived — equity series** (`utils/equitySeries.ts`):
  - `buildEquitySeries(trades)` → closed trades sorted by `exitTime` ascending,
    reduced to cumulative `pnl` points, anchored with a leading zero point.

## Public API (via `index.ts`)

- `useTrades()` — fetches trades, derives per-trade metrics + summary. Returns
  `{ trades, summary, loading, error }`. This is the one hook feature pages use;
  they never call `fetchTrades` or the metrics utils directly.
- `addTrade(input: NewTrade)` — `POST /trades`, always opens with `exitPrice`/
  `exitTime: null`. Used by `modules/place-trade` to convert a watched symbol
  into a live trade.
- `buildEquitySeries(trades)` + `EquityPoint` type.
- Types: `Trade`, `TradeSide`, `TradeStatus`, `TradeOutcome`, `TradeMetrics`,
  `TradeWithMetrics`, `DashboardSummary`, `NewTrade`.

## Module map

```
frontend/src/modules/trades/
├── index.ts                   # the ONLY import path other modules should use
├── types/trade.ts             # Trade, TradeSide, derived types, DashboardSummary
├── api/tradesApi.ts           # fetchTrades()
├── hooks/useTrades.ts         # fetch + derive metrics + summary; {loading,error,…}
└── utils/
    ├── tradeMetrics.ts        # computeTradeMetrics, summarize, sortByEntryDesc
    └── equitySeries.ts        # buildEquitySeries (cumulative P&L points)
```

This module has no `Page.tsx` and is never routed directly — it exists to be
imported by `dashboard` and `equity` (and any future trade-derived feature).
