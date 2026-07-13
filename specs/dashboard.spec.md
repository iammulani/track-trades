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

1. **Header** (`shared/PageHeader`) — icon chip + title "Dashboard" + one-line subtitle.
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
   `Result` (win/loss badge). Rows are clickable (and keyboard-focusable — Enter/Space
   also opens it) and open the **trade detail popup**.
4. **Trade detail popup** (`TradeDetailModal`, shared `Modal`) — avatar + symbol +
   side/result badges, the core fill stats (entry, exit, quantity, hold, return,
   P&L), notes if any, then, when the trade carries a `setup` (see
   [trades.spec.md](trades.spec.md) / [place-trade.spec.md](place-trade.spec.md)):
   the rating (stars + % + verdict, as it stood at placement — not recomputed),
   how long the symbol was watched before being traded, stop loss/target, the
   selected Stage & Base (colour-coded to match their tone, reusing
   `STAGE_OPTIONS`/`BASE_OPTIONS` from `modules/place-trade`), the technical
   checklist + RSI/50-day MA/52-week range, VCP structure (weeks in base, each
   contraction's high/low and derived %, largest/narrowest), and the overhead-supply
   / breakout-confirmation checklists. Trades placed before this was captured (or
   entered outside the stepper) show a plain "No setup captured" note instead.

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
    ├── TradesTable.tsx        # the detail table; owns the detail-popup open/close state
    ├── TradeDetailModal.tsx   # read-only trade + setup detail, opened from a table row
    └── ResultBadge.tsx        # win/loss pill

frontend/src/shared/
├── components/Card.tsx        # surface container used across modules
├── components/Layout.tsx      # sidebar + content shell
├── components/Icon.tsx        # inline SVG icon set
├── components/Modal.tsx       # backdrop + card shell — also used by the watchlist's popups
├── components/SideBadge.tsx   # long/short pill — also used by the watchlist table
└── utils/format.ts            # currency / percent / duration / datetime
```

Data types and metrics come from `modules/trades` — see
[trades.spec.md](trades.spec.md). `TradeDetailModal` also reuses
`STAGE_OPTIONS`, `BASE_OPTIONS`, `INDICATOR_CHECKLIST_ITEMS`,
`OVERHEAD_SUPPLY_CHECKLIST_ITEMS`, `BREAKOUT_CONFIRMATION_CHECKLIST_ITEMS`, and
`ratingVerdict` from `modules/place-trade`'s barrel, so the stage/base labels,
checklist copy, and rating thresholds can't drift from the stepper that
originally captured them.
