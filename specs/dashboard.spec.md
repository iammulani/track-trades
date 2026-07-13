# Dashboard — Spec

## Purpose

The trader's at-a-glance view of past trades: how often they win, how much
they make, and the full detail of every trade (stock, direction, entry/exit
price and time, how long they were in it, and the result).

## Data

Consumes the shared trade domain — see [trades.spec.md](trades.spec.md) for the
raw shape and every derived metric. This page uses `useTrades()` for
`{ trades, summary, loading, error, closing, closeTrade }` and does not
compute anything itself — `closeTrade` is passed down to `TradesTable` for
the Exit action.

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
   `Result` (win/loss badge), then a trailing actions cell with, for **open**
   trades only, an **Exit** pill button, and for every trade a **link icon**
   that opens that trade's full detail — including the setup captured when it
   was placed — in a **new tab**, read-only. See
   [trade-detail.spec.md](trade-detail.spec.md).
4. **Exit Trade popup** (`ExitTradeModal`, shared `Modal`, 680px wide — the
   widest of the form popups, with its own scroll past ~82vh tall, so the
   repeatable learning cards have real room instead of feeling cramped) —
   opened by the Exit button; owns its own open/close state inside
   `TradesTable`, same pattern as the watchlist's remove-confirmation:
   - **Exit date & time** and **Exit price** sit side by side (defaults to
     now, capped at now — can be backdated but not set in the future).
   - **Exit price** — paired with a live preview panel (`computeExitPreview`,
     [trades.spec.md](trades.spec.md)): Return (%), P&L ($, both
     green/red by sign), and realized Risk : Reward (`N.NR`, `—` if the
     trade has no captured stop loss). A note explains the `—` when there's
     no stop.
   - **Learnings** (optional, up to `MAX_EXIT_REASONS` (5) — `modules/trades`)
     — one card per learning, each with its **own** reason dropdown
     (`EXIT_REASON_OPTIONS`, a fixed taxonomy so it can be grouped/reported
     on later) **and its own note textarea** — not one dropdown plus a
     single shared note. A trade can have several independent takeaways
     (e.g. "Hit Target" with one note, and separately "Mistake — Broke
     Trading Rule" with a different note), so each pairing needs its own
     explanation. Each card gets a remove (×) once there's more than one,
     and an **"Add another learning"** button below (hidden at the cap).
     Rows left with no reason picked are dropped on submit.
   - Submitting calls `closeTrade(id, { exitPrice, exitTime, exitLearnings })`
     and closes the popup; the table refetches silently.

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
- Exit is only offered while a trade is `open` — once closed, the Exit button
  is gone (the trade is done, so the answers it captured aren't editable —
  see [trade-detail.spec.md](trade-detail.spec.md) for viewing them).

## Module map

```
frontend/src/modules/dashboard/
├── DashboardPage.tsx          # composes the sections
├── index.ts                   # exports DashboardPage
└── components/
    ├── StatsGrid.tsx          # lays out the KPI tiles
    ├── StatTile.tsx           # one KPI tile (icon chip · label · value · sub)
    ├── WinLossBar.tsx         # win/loss proportion bar (has onHero variant)
    ├── TradesTable.tsx        # the detail table; owns the Exit popup's open/close state
    └── ExitTradeModal.tsx     # exit date/time + price + live preview + repeatable reason+note learning cards

frontend/src/shared/
├── components/Card.tsx        # surface container used across modules
├── components/Layout.tsx      # sidebar + content shell
├── components/Icon.tsx        # inline SVG icon set
├── components/SideBadge.tsx   # long/short pill — also used by the watchlist table
├── components/ResultBadge.tsx # win/loss pill — also used by trade-detail
├── components/Modal.tsx       # backdrop + card shell — also used by the watchlist's popups
└── utils/
    ├── format.ts               # currency / percent / duration / datetime
    └── dateInput.ts            # nowDateTimeLocalValue/dateTimeLocalValueToIso back the Exit popup's date field — same helper family as the watchlist/place-trade date backdating
```

Data types and metrics come from `modules/trades` — see
[trades.spec.md](trades.spec.md). The per-row detail link opens
`modules/trade-detail` — see [trade-detail.spec.md](trade-detail.spec.md).
