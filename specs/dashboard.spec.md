# Dashboard — Spec

## Purpose

The trader's at-a-glance view of past trades: how often they win, how much they
make, and the full detail of every trade (stock, direction, entry/exit price and
time, how long they were in it, and the result). Everything is derived from
`db.json`.

## Data

- **Source:** `GET /api/trades` → the `trades` resource in `backend/db.json`.
- **Raw shape** (`modules/dashboard/types/trade.ts`):

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

## UI

Modern SaaS layout: a fixed **sidebar** (brand + nav, from `shared/Layout`) beside a
content area. Content, top to bottom:

1. **Header** — title "Dashboard" + one-line subtitle.
2. **Stats row** — KPI tiles (`StatsGrid` → `StatTile`), each with an icon chip:
   - **Win rate** (the gradient **hero** card) with a **win/loss proportion bar**
     underneath (labelled, never colour alone).
   - **Net P&L** (green if ≥ 0, red if < 0).
   - **Total trades** (with wins/losses breakdown as sub-text).
   - **Avg return %**.
   - **Avg hold time** (humanised duration).
3. **Equity curve** (`EquityCurve`) — one-series area + line of cumulative P&L across
   closed trades over time. Hairline grid, ~10% area wash, hover crosshair + tooltip.
   Shown only when there are ≥ 2 equity points.
4. **Trades table** (`TradesTable`) — one row per trade, most recent first, in a card
   with a per-symbol avatar chip. Columns: `Stock` · `Side` · `Qty` · `Entry`
   (price + time) · `Exit` (price + time) · `Hold` (duration) · `Return %` · `P&L` ·
   `Result` (win/loss badge).

## Behaviour

- Table sorted by `entryTime` descending (newest first).
- **Colour = result**, from the reserved status palette: win → good green
  (`#0ca30c`), loss → critical red (`#d03b3b`). Always paired with a text label or
  badge — colour never carries meaning alone.
- P&L / return values: green when positive, red when negative, muted when flat.
- Formatting via `shared/utils/format.ts`: currency (`$1,234.50`), signed percent
  (`+6.2%`), duration (`4h 35m`, `2d 6h`), datetime (`Jun 2, 09:35`).
- **States:** loading → skeleton/"Loading…"; error → message; empty → "No trades yet".

## Module map

```
frontend/src/modules/dashboard/
├── DashboardPage.tsx          # composes the sections
├── index.ts                   # exports DashboardPage
├── types/trade.ts             # Trade, TradeSide, derived types, DashboardSummary
├── api/tradesApi.ts           # fetchTrades()
├── hooks/useDashboard.ts      # fetch + derive metrics + summary; {loading,error,…}
├── utils/
│   ├── tradeMetrics.ts        # computeTradeMetrics, summarize
│   └── equitySeries.ts        # buildEquitySeries (cumulative P&L points)
└── components/
    ├── StatsGrid.tsx          # lays out the KPI tiles
    ├── StatTile.tsx           # one KPI tile (icon chip · label · value · sub)
    ├── WinLossBar.tsx         # win/loss proportion bar (has onHero variant)
    ├── EquityCurve.tsx        # cumulative-P&L area/line chart with tooltip
    ├── TradesTable.tsx        # the detail table
    └── ResultBadge.tsx        # win/loss pill

frontend/src/shared/
├── components/Card.tsx        # surface container used across modules
├── components/Layout.tsx      # sidebar + content shell
├── components/Icon.tsx        # inline SVG icon set
└── utils/format.ts            # currency / percent / duration / datetime
```
