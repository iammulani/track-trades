# Dashboard — Spec

## Purpose

The trader's at-a-glance view of past trades: how often they win, how much
they make, and the full detail of every trade (stock, direction, entry/exit
price and time, how long they were in it, and the result).

## Data

Consumes the shared trade domain — see [trades.spec.md](trades.spec.md) for the
raw shape and every derived metric. This page uses `useTrades()` for
`{ trades, summary, loading, error }` and does not compute anything itself.

## UI

Modern SaaS layout: a fixed **sidebar** (brand + nav, from `shared/Layout`) beside
a content area. Content, top to bottom:

1. **Header** — title "Dashboard" + one-line subtitle.
2. **Stats row** — KPI tiles (`StatsGrid` → `StatTile`), each with an icon chip:
   - **Win rate** (the gradient **hero** card) with a **win/loss proportion bar**
     underneath (labelled, never colour alone).
   - **Net P&L** (green if ≥ 0, red if < 0).
   - **Total trades** (with wins/losses breakdown as sub-text).
   - **Avg return %**.
   - **Avg hold time** (humanised duration).
3. **Trades table** (`TradesTable`) — one row per trade, most recent first, in a
   card with a per-symbol avatar chip. Columns: `Stock` · `Side` · `Qty` · `Entry`
   (price + time) · `Exit` (price + time) · `Hold` (duration) · `Return %` · `P&L` ·
   `Result` (win/loss badge).

The equity curve is its own page — see [equity.spec.md](equity.spec.md).

## Behaviour

- Table sorted by `entryTime` descending (newest first).
- **Colour = result**, from the reserved status palette: win → good green
  (`#0ca30c`), loss → critical red (`#d03b3b`). Always paired with a text label or
  badge — colour never carries meaning alone.
- P&L / return values: green when positive, red when negative, muted when flat.
- Formatting via `shared/utils/format.ts`: currency (`$1,234.50`), signed percent
  (`+6.2%`), duration (`4h 35m`, `2d 6h`), datetime (`Jun 2, 09:35`).
- **States:** loading → "Loading…"; error → message; empty → "No trades yet".

## Module map

```
frontend/src/modules/dashboard/
├── DashboardPage.tsx          # composes the sections
├── index.ts                   # exports DashboardPage
└── components/
    ├── StatsGrid.tsx          # lays out the KPI tiles
    ├── StatTile.tsx           # one KPI tile (icon chip · label · value · sub)
    ├── WinLossBar.tsx         # win/loss proportion bar (has onHero variant)
    ├── TradesTable.tsx        # the detail table
    └── ResultBadge.tsx        # win/loss pill

frontend/src/shared/
├── components/Card.tsx        # surface container used across modules
├── components/Layout.tsx      # sidebar + content shell
├── components/Icon.tsx        # inline SVG icon set
└── utils/format.ts            # currency / percent / duration / datetime
```

Data types and metrics come from `modules/trades` — see
[trades.spec.md](trades.spec.md).
