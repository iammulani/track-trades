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
  | `setup`      | `TradeSetup \| null` | the place-trade stepper's answers, captured at placement (see below) — absent/`null` for trades not placed through the stepper |
  | `exitLearnings` | `ExitLearning[]`  | 0 to `MAX_EXIT_REASONS` reason+note pairs captured at exit, set together with `exitPrice`/`exitTime` (see below) |

- **`TradeSetup`** — everything the [place-trade](place-trade.spec.md) stepper
  collects beyond the fill data itself, written once at placement and never
  recomputed (a point-in-time record, not a live derivation — kept so the
  original setup can be analyzed later, e.g. "do tight VCPs actually
  outperform?"):

  | field                | type                          | meaning                                              |
  | --------------------- | ----------------------------- | ----------------------------------------------------- |
  | `watchedSince`         | string \| null (ISO)          | the watchlist item's `watchedSince` — how long it was watched before being traded |
  | `stopLoss` / `target`  | number \| null                | risk-management levels entered in Trade Setup          |
  | `stage` / `base`       | `TradeStage \| null` / `TradeBase \| null` | the selected Stage & Base options            |
  | `rsi` / `fiftyDayMa`   | number \| null                | Technical Confirmation readings — `rsi` is the RSI, on a 1–99 scale |
  | `technicalChecklist`   | `TradeChecklist`              | the MA checklist, ticked item ids -> `true`             |
  | `week52Low` / `week52High` | number \| null            | 52-Week Range inputs                                    |
  | `weeksInBase`          | number \| null                | VCP Structure's time-in-base                            |
  | `vcpContractions`      | `TradeVcpContraction[]`       | each filled contraction's `{ high, low }`               |
  | `finalChecks`          | `TradeChecklist`              | overhead-supply + breakout-confirmation checklist        |
  | `rating`               | `TradeRatingSnapshot` \| null | The rating **frozen at placement** — `ratio`, `rawRatio`, and every criterion's `{id, weight, score}` + every gate's `{id, state, cap}`. See below. |
  | `fundamentals`         | `Code33Snapshot` \| null      | The Code 33 fundamentals read **frozen at placement**. See below. |

- **`TradeRatingSnapshot`** — the rating **as judged on the day the trade was
  taken**, written once and read back forever. This is the app's one deliberate
  exception to *"derive, don't store"* (convention 4 in `CLAUDE.md`), and the
  reason is worth stating: P&L is a *fact* about the numbers, so recomputing it
  always gives the same answer — but a rating is a *judgement*, and the formula
  is expected to be re-tuned as the strategy sharpens. If the Trade Detail page
  recomputed, every past trade would be silently re-graded by today's rules and
  the journal would lose the record of what you actually believed when you
  clicked buy. So the score is frozen instead:
  - `ratio` (the capped score that counted) and `rawRatio` (criteria only), 0..1.
  - `criteria` — `{ id, weight, score }` per criterion. **Ids and numbers only:**
    the label is looked up from code by `id` at render time
    (`CRITERION_LABELS` in `place-trade/utils/tradeRating.ts`), so copy can be
    reworded later without rewriting history.
  - `gates` — `{ id, state, cap }` per non-negotiable, **including the cap that
    was in force at the time**, so re-tuning a cap can't retroactively move an
    old trade's score. Label/reason likewise come from code (`GATE_META`).

  Written by `toRatingSnapshot()` at placement; read by `fromRatingSnapshot()`,
  which rebuilds a full `TradeRating` for the UI taking `ratio`/`rawRatio`
  **verbatim** rather than re-deriving them. Both live in
  `modules/place-trade` — see [place-trade.spec.md](place-trade.spec.md).

- **`Code33Snapshot`** — the Code 33 fundamentals read **as computed on the day the
  trade was taken**, frozen the same way `TradeRatingSnapshot` is: a point-in-time
  judgement, not a live derivation, so re-tuning the Code 33 formula later doesn't
  retroactively regrade a trade you already took. Three parts:
  - **The frozen score** — `status` (`'partial' | 'complete'` — never `'pending'`; see
    below), `ratio`, `stars`, `hits` / `totalChecks`, and the per-metric `epsHits` /
    `salesHits` / `marginHits` (see [fundamentals.spec.md](fundamentals.spec.md) for
    what these count). Just numbers, no id-keyed prose to look up — Code 33's verdict
    is banded straight from `ratio`/`status` by `code33Verdict()`, live, whether it's
    fed a fresh `Code33Rating` or a replayed `Code33Snapshot`.
  - **`quarters: TradeQuarterFinancials[]`** — every quarter that had a value entered
    at the moment of placement (`{ period, sales, netProfit, eps }`, each figure
    `number | null` — parsed once, since nothing on a frozen trade is ever re-edited;
    mirrors how `TradeVcpContraction` stores parsed numbers rather than the editable
    string form `VcpContraction` uses). **This is the actual raw data, not a
    derivation** — the source fundamentals record is deleted the moment the trade is
    placed (see below), so without this the quarterly figures the trader actually
    read would be lost for good, leaving only an unexplained aggregate score. Net
    margin and YoY growth per quarter are *not* stored alongside it — those are
    recomputed on read via `deriveQuarters()` (`modules/fundamentals`), the same pure
    function the live grid uses, since they're facts about the stored numbers, not a
    judgement (convention 4: derive, don't store — this part of the snapshot follows
    the normal rule; only the score itself is the deliberate exception).
  - **`steps: TradeCode33Step[]`** — `{ fromPeriod, toPeriod, epsAccelerated,
    salesAccelerated, marginExpanded }` per step, mirroring `Code33Step` in
    `modules/fundamentals` (inlined here, not imported — same reason
    `Code33SnapshotStatus` repeats `Code33Status`'s literals). **This one *is* frozen
    judgement, not a derivation** — unlike margin/growth, "did this accelerate" is
    exactly the call the score itself is built from, so it's kept alongside `quarters`
    rather than recomputed from them on read. Without it, Trade Detail's quarterly
    table would have the right numbers but no way to colour which quarters actually
    drove the score — and worse, recomputing it from the frozen `quarters` on every
    render would let a later change to the acceleration formula make the table's
    colours disagree with the trade's own frozen `hits`/`epsHits`/etc.

  Written by `toCode33Snapshot(rating, quarters)` in `modules/fundamentals`, called
  from `usePlaceTrade`'s `placeTrade()` — see [place-trade.spec.md](place-trade.spec.md).
  The score is read back on Trade Detail with no rebuild step: `code33Verdict()` and
  `metricTone()` both accept the snapshot directly (see `Code33Score` in
  [fundamentals.spec.md](fundamentals.spec.md) — a live `Code33Rating` and a frozen
  `Code33Snapshot` are structurally interchangeable for rendering purposes, unlike
  the rating, which needs `fromRatingSnapshot()`'s id-lookup rebuild). The quarters
  are read back through `deriveQuarters(setup.fundamentals.quarters)` to reconstruct
  the full table, margins and growth included; the steps are read back through
  `buildQuarterTones(setup.fundamentals.steps)` to colour that table's cells the
  same way the live grid colours its own.

  `toCode33Snapshot()` returns `null` for a `'pending'` read (not enough consecutive
  quarters to judge) — a `pending` state isn't a judgement worth freezing, so
  `setup.fundamentals` is `null` for both "no fundamentals record existed at
  placement" and "one existed but wasn't scoreable yet." Either way, the source
  fundamentals record is deleted once the trade is placed, regardless of whether it
  produced a snapshot — see fundamentals.spec.md's "never orphaned" rule, which
  trade placement satisfies via this same path (not through the watchlist-removal
  path drafts/fundamentals normally get cleaned up through, since placing a trade
  calls `removeItem` directly rather than `WatchlistPage`'s remove handler).

- **`ExitReason`** — a fixed, closed-ended taxonomy (`utils/exitReasons.ts` →
  `EXIT_REASON_OPTIONS`, `exitReasonLabel()`) so exit reasons can be
  grouped/counted in a future report instead of drifting as free text: Hit
  Target, Stopped Out — As Planned, Stopped Out — Widened Stop, Trailing
  Stop, Discretionary — Thesis Changed, Time-Based Exit, Mistake —
  Emotional / Fear, Mistake — Broke Trading Rule, Mistake — Missed Exit
  Signal, Mistake — Early Entry, Market / News Event, Other.

- **`ExitLearning`** (`{ reason: ExitReason; note: string }`) — one exit
  takeaway: the reportable category paired with its *own* free-text note, not
  one shared note for the whole exit. A trade can have several, independent
  of each other — e.g. `{ reason: 'hit-target', note: 'sold into strength
  right at resistance' }` **and**, separately, `{ reason:
  'mistake-broke-rule', note: 'moved my stop up too early out of fear' }` —
  capped at `MAX_EXIT_REASONS` (5) so it stays a handful of deliberate
  entries, not a dumping ground. Rows left with no reason picked are dropped
  on submit.

- **Derived — per trade** (`utils/tradeMetrics.ts`):
  - `status`: `closed` if `exitPrice` and `exitTime` are set, else `open`.
  - `pnl`: long → `(exit − entry) × qty`; short → `(entry − exit) × qty`. `null` if open.
  - `pnlPercent`: long → `(exit − entry) / entry × 100`; short → `(entry − exit) / entry × 100`.
  - `outcome`: `win` if `pnl > 0`, `loss` if `pnl < 0`, `breakeven` if `0`, `null` if open.
  - `durationMs`: `exitTime − entryTime` (for open trades, `now − entryTime`).

- **`computeExitPreview(trade, exitPriceInput, stopLoss)`** (`utils/tradeMetrics.ts`)
  — live preview of closing at a given price: `pnl`, `pnlPercent` (same
  formulas as above, from a still-being-typed string price) plus
  `riskRewardRatio` — the realized R-multiple, `pnlPerShare / riskPerShare`
  where `riskPerShare = (entry − stopLoss) × direction`; `null` with no
  captured `stopLoss` or a non-risk-reducing one. Used both live (Exit
  Trade popup, string input) and after the fact (Trade Detail page, feeding
  the stored `exitPrice` back in) — one function, so the two can't diverge.

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
  `{ trades, summary, loading, error, closing, closeTrade }`. This is the one
  hook feature pages use; they never call `fetchTrades`/`closeTradeApi` or
  the metrics utils directly. `closeTrade(id, input: CloseTradeInput)` -
  `PATCH /trades/:id` with `exitPrice`, `exitTime`, `exitLearnings`, then a
  silent refetch (`closing` is true mid-request, no loading flash — same
  pattern as `useWatchlist`).
- `addTrade(input: NewTrade)` — `POST /trades`, always opens with `exitPrice`/
  `exitTime: null`. Used by `modules/place-trade` to convert a watched symbol
  into a live trade.
- `closeTrade(id, input)` — the raw API call `useTrades()` wraps; exported
  for completeness but feature pages should use the hook's version.
- `buildEquitySeries(trades)` + `EquityPoint` type.
- `computeExitPreview`, `EXIT_REASON_OPTIONS`, `MAX_EXIT_REASONS`,
  `exitReasonLabel`.
- Types: `Trade`, `TradeSide`, `TradeStatus`, `TradeOutcome`, `TradeStage`,
  `TradeBase`, `TradeChecklist`, `TradeVcpContraction`, `TradeSetup`,
  `TradeRatingSnapshot`, `TradeRatingCriterionSnapshot`, `TradeRatingGateSnapshot`,
  `Code33Snapshot`, `Code33SnapshotStatus`, `TradeQuarterFinancials`, `TradeCode33Step`,
  `TradeMetrics`, `TradeWithMetrics`, `DashboardSummary`, `NewTrade`,
  `ExitReason`, `ExitLearning`, `CloseTradeInput`, `ExitPreview`.

## Module map

```
frontend/src/modules/trades/
├── index.ts                   # the ONLY import path other modules should use
├── types/trade.ts             # Trade, TradeSide, derived types, DashboardSummary, ExitReason, ExitLearning, CloseTradeInput
├── api/tradesApi.ts           # fetchTrades(), addTrade(), closeTrade()
├── hooks/useTrades.ts         # fetch + derive metrics + summary; {loading,error,closing,closeTrade,…}
└── utils/
    ├── tradeMetrics.ts        # computeTradeMetrics, summarize, sortByEntryDesc, computeExitPreview
    ├── exitReasons.ts         # EXIT_REASON_OPTIONS/MAX_EXIT_REASONS (fixed taxonomy + labels), exitReasonLabel()
    └── equitySeries.ts        # buildEquitySeries (cumulative P&L points)
```

This module has no `Page.tsx` and is never routed directly — it exists to be
imported by `dashboard` and `equity` (and any future trade-derived feature).
