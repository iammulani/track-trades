# Trade Detail — Spec

## Purpose

A read-only record of a single trade: the core fill data plus, when it was
placed through the stepper, the full setup that justified it — for reviewing
past decisions, not editing them.

## Data

Consumes the shared trade domain — see [trades.spec.md](trades.spec.md) for
the raw `Trade`/`TradeSetup` shape and every derived metric. This page uses
`useTrades()` for `{ trades, loading, error }` and finds the trade matching
the `:id` route param client-side (no dedicated single-trade endpoint).
Beyond what `modules/trades` already derives, this page also:

- Recomputes the full `TradeRating` (score, weights, and the per-criterion
  breakdown) via `computeTradeRating()` from `modules/place-trade`, fed from
  the trade's persisted `setup` fields (converted back to the
  string-typed shape that function expects, since it was built for the live
  stepper form). This reconstructs the Review step's "Why N%?" breakdown
  after the fact — it isn't itself stored, only the raw inputs are (see
  `TradeSetup` in [trades.spec.md](trades.spec.md)). In practice this
  matches the stored `setup.ratingRatio` snapshot exactly, since nothing
  about the scoring logic has changed since placement; the two would only
  diverge if the rating formula is retuned later.
- A couple of presentational-only calculations (per-contraction % pullback,
  largest/narrowest of a trade's VCP contractions) mirrored from
  [place-trade.spec.md](place-trade.spec.md)'s VCP Structure step, since
  those apply to the *stored* numeric `vcpContractions`, not the live
  string-typed editing form.
- For closed trades, `computeExitPreview()` (`modules/trades`) fed the
  stored `exitPrice` back in — the same function the Exit popup uses live —
  to get the realized Risk : Reward without duplicating that math.

## UI

Reached by clicking the link icon at the end of a row in the Dashboard's
trades table (`TradesTable`) — opens in a **new tab**
(`target="_blank"`), so reviewing a trade's setup never navigates away from
the dashboard. Route: `/trades/:id`.

Full page width, same `max-width: 1240px` content container as every other
page (Dashboard, Watchlist, Place Trade, Equity) — not a narrow, popup-like
column.

1. **Header** (`shared/PageHeader`) — `info` icon + "Trade Detail" + subtitle,
   with a "← Back to Dashboard" link in the header's actions slot.
2. **Card** — avatar + symbol + `SideBadge` + `ResultBadge`, then:
   - Core stats grid: entry (price + time), exit (price + time, or "Still
     open"), quantity, hold duration, return %, P&L (green/red by sign,
     matching the dashboard table's convention).
   - Notes, if any.
   - **Exit** (only when the trade is closed) — the realized **Risk : Reward**
     (`N.NR`, `—` with no captured stop loss), then, if any were captured, a
     list of **exit learnings** — one card per `ExitLearning`, its reason
     label (`exitReasonLabel()`) followed by its own note underneath (not a
     single shared note). Set once, when the trade was closed via the
     Dashboard's Exit popup — see [dashboard.spec.md](dashboard.spec.md).
   - If the trade has no `setup` (placed before this was captured, or
     entered outside the stepper): a plain fallback note instead of the
     sections below.
   - If it has a `setup`:
     - **Rating** — stars + % + verdict (`ratingVerdict()` from
       `modules/place-trade`), from the recomputed `TradeRating` (see Data).
     - **"Why N%?" breakdown** — every criterion listed with its state icon
       (met/partial/unmet) and the points it contributed out of its weight,
       headed by the running earned/total weight — identical in spirit to
       the Review step's breakdown in [place-trade.spec.md](place-trade.spec.md),
       reconstructed here from the stored setup. Partial rows get an amber
       background, unmet rows a red one, so dropped points are what jumps out.
     - **Setup** — how long the symbol was watched before being traded
       (`entryTime − watchedSince`), stop loss, target.
     - **Stage & Base** — labels + verdict, colour-coded by tone, from
       `STAGE_OPTIONS`/`BASE_OPTIONS` (`modules/place-trade`).
     - **Technicals** — MA checklist confirmed-count, RSI, 50-day MA,
       52-week low/high.
     - **VCP Structure** — weeks in base, largest correction, narrowest
       pullback, and each contraction (T1, T2, …) with its high → low and
       derived %.
     - **Overhead Supply** / **Breakout Confirmation** — each checklist,
       confirmed-count in the heading, checked items styled distinctly from
       unchecked (struck through, muted).
3. **States:** loading → "Loading…"; error → message; trade not found (bad
   id, or somehow removed) → message, no card.

## Behaviour

- Entirely read-only — no inputs, no writes. This is a review surface, not
  an editor.
- Formatting via `shared/utils/format.ts`, same conventions as the
  Dashboard (currency, signed percent, duration, datetime).

## Module map

```
frontend/src/modules/trade-detail/
├── TradeDetailPage.tsx   # loads the trade by :id, renders it
├── TradeDetailPage.css
└── index.ts              # exports TradeDetailPage
```

Depends on `modules/trades` (`useTrades`, `TradeVcpContraction`,
`computeExitPreview`, `exitReasonLabel`) and
`modules/place-trade` (`STAGE_OPTIONS`, `BASE_OPTIONS`,
`INDICATOR_CHECKLIST_ITEMS`, `OVERHEAD_SUPPLY_CHECKLIST_ITEMS`,
`BREAKOUT_CONFIRMATION_CHECKLIST_ITEMS`, `computeTradeRating`,
`criterionState`, `criterionPoints`, `CRITERION_STATE_ICON`, `formatPoints`,
`ratingVerdict`) through their `index.ts` barrels, so the stage/base labels,
checklist copy, and rating/breakdown logic can't drift from the stepper that
originally captured them. Also uses
`shared/components/{Card,PageHeader,SideBadge,ResultBadge}` and
`shared/utils/{avatarColor,format}`.
