# Equity Curve — Spec

## Purpose

A dedicated, full-size view of cumulative profit and loss over time — split out
from the dashboard so the chart has room to breathe instead of competing with
the KPI row and trades table for vertical space.

## Data

Consumes the shared trade domain — see [trades.spec.md](trades.spec.md).
This page calls `useTrades()` for the trade list, then derives the series with
`buildEquitySeries(trades)`:

- Closed trades only, ordered by `exitTime` ascending.
- Each point: `{ time, cumulative, pnl, symbol }` — `cumulative` is the running
  sum of `pnl` up to and including that trade.
- A leading zero point anchors the curve to the baseline.

## UI

Same sidebar shell as the rest of the app (`shared/Layout`), reached via the
**Equity Curve** nav item. Content:

1. **Header** — title "Equity Curve" + one-line subtitle.
2. **Chart card** (`EquityCurve`) at **full size** (not the compact variant used
   inline elsewhere): one-series area + line of cumulative P&L, hairline grid
   with clean round-number y ticks, a $0 baseline, an end-dot marking the latest
   value, and a hover crosshair + tooltip (value + trade symbol + exit time).
   Card header shows the total cumulative P&L, coloured green/red by sign.

## Behaviour

- Rendered only when there are ≥ 2 equity points (i.e. at least one closed
  trade); otherwise shows "Not enough closed trades yet to plot a curve."
- Single series → no legend needed (title + card total already say what's
  plotted), per the dataviz mark rules.
- **States:** loading → "Loading…"; error → message.

## Module map

```
frontend/src/modules/equity/
├── EquityPage.tsx             # page: header + EquityCurve
├── EquityPage.css
├── index.ts                   # exports EquityPage
└── components/
    ├── EquityCurve.tsx        # cumulative-P&L area/line chart with tooltip
    └── EquityCurve.css
```

Data (`useTrades`, `buildEquitySeries`, `EquityPoint`) comes from
`modules/trades` — see [trades.spec.md](trades.spec.md).
