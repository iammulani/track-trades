# Fundamentals — Spec

## Purpose

Quarterly financials (Sales, Net Profit, EPS) captured against a watchlist item, plus the
derivation of Mark Minervini's **"Code 33"** — a company is hitting on all cylinders when EPS
growth, Sales growth, and Net Profit Margin all accelerate together for 3 consecutive quarters.
The user types only the raw figures off a source like screener.in; every percentage and the
final star rating is computed, never entered.

Domain-only module: no page, no route. It's the data layer that
[verify-fundamental.spec.md](verify-fundamental.spec.md) (captures and edits the figures),
[watchlist.spec.md](watchlist.spec.md) (surfaces the rating on the row), and
[place-trade.spec.md](place-trade.spec.md) (freezes a snapshot at trade placement) all
consume — see convention 7 in [`../CLAUDE.md`](../CLAUDE.md). All three import it, so
**`fundamentals` imports none of them** — it stays a leaf, the same arrangement as
[drafts.spec.md](drafts.spec.md). It does import a type from `modules/trades`
(`Code33Snapshot`, for `toCode33Snapshot()`'s return type) — safe, since `trades` is a
foundational domain module that doesn't import back from any of `fundamentals`'s own
consumers, so this can't create a cycle (same relationship `place-trade`'s
`toRatingSnapshot()` already has with `trades`' `TradeRatingSnapshot`).

## Data

- **Source**: `/fundamentals`, from `backend/data/fundamentals.json` (starts as `[]`). No
  backend code needed — `merge-db.js` turns any file in `data/` into an endpoint.
- **Shape** (`types/fundamentals.ts`): one record per watchlist item, keyed by `watchlistItemId`.

  ```ts
  interface QuarterFinancials {
    period: string // "YYYY-MM" — the quarter's end month, e.g. "2026-06"
    sales: string
    netProfit: string
    eps: string
  }

  interface FundamentalsRecord {
    id: string
    watchlistItemId: string
    asOfPeriod: string // "YYYY-MM" — the most recent quarter being evaluated
    quarterCount: number // how many trailing quarters (from asOfPeriod) the grid shows
    quarters: QuarterFinancials[] // sparse — only quarters with a value entered
    updatedAt: string
  }
  ```

- **Every value is the raw string typed**, not a parsed number — same rule `TradeParams` follows
  in [drafts.spec.md](drafts.spec.md): resuming has to restore what was typed, not a
  re-rendering of it. Parsing happens live, in the derivation, every time.

- **`period` is a real, sortable key** ("YYYY-MM"), never free text and never a row position.
  Both the year-over-year lookup and the "3 consecutive quarters" check key off exact period
  math — a quarter exactly 12 months earlier for YoY, a quarter exactly 3 months later for
  "consecutive" — never `i±4` positional indexing. A skipped or out-of-order quarter can
  therefore never silently corrupt the read; it just reads as missing data.

- **`quarters` is sparse and generated, not manually built.** There's no per-row date picker
  and no manual add/remove-row control. `asOfPeriod` + `quarterCount` alone drive the grid
  ([verify-fundamental.spec.md](verify-fundamental.spec.md) generates `quarterCount` periods
  stepping back 3 months at a time from `asOfPeriod`, inclusive). `asOfPeriod` is the most
  recent quarter being evaluated, not necessarily today's — so a stock's fundamentals can be
  checked as they stood on a past date (e.g. against an old trade), not only the present.

- **`asOfPeriod` is always a fixed calendar quarter-end** — its month is always `03`, `06`, `09`,
  or `12`, never an arbitrary one. It's set through `AsOfPicker` (`verify-fundamental`), which
  takes a plain date and resolves it to the most recent quarter that had already closed by then
  — never lets "as of" itself be picked as an arbitrary month. Every period the grid generates
  is 3 months from a valid quarter-end, so it's always another valid quarter-end too.

- `quarterCount` starts at **8** and grows 4 at a time when the user asks for more history via
  "Show earlier quarters." Only periods with at least one non-empty value are written back;
  changing `asOfPeriod` or shrinking `quarterCount` drops whatever falls outside the new range
  rather than keeping it around unseen.

- **Derived, never stored** (`utils/quarterlyCalc.ts`, convention 4 — computed from the raw
  quarters every time, on every render):

  | value           | formula                                                                              |
  | --------------- | ------------------------------------------------------------------------------------- |
  | `netMargin`     | `netProfit / sales * 100` — `null` if sales is blank or ≤ 0                          |
  | `salesGrowthYoY`| `(sales − priorYearSales) / priorYearSales * 100` — `null` without an exact same-quarter-prior-year row, or if that row's sales ≤ 0 |
  | `epsGrowthYoY`  | `(eps − priorYearEps) / abs(priorYearEps) * 100` — `null` without a prior-year row, or if its EPS is 0. Divided by the *absolute* prior value so a prior-year loss flipping sign doesn't misread a recovery as a decline. |

- **Code 33 rating** (`utils/code33.ts`):
  1. Derive every quarter, sort ascending by period.
  2. Find the **trailing run** of period-consecutive quarters (ending at the most recent one)
     that all have full YoY data — a blank or missing quarter cuts the run rather than being
     bridged over, so the read always reflects the *current* unbroken streak, not a stale one.
  3. Take the most recent up to 4 quarters of that run → 0–3 step-comparisons.
     - 0–1 usable quarters → `status: 'pending'` — not enough data to judge (never a false
       "no acceleration").
     - 2–3 → `status: 'partial'`, scored on 1–2 steps.
     - 4 → `status: 'complete'`, the full 3-step read.
  4. Per step (quarter *N* vs. quarter *N−1*): does EPS growth, Sales growth, and Net Margin
     each move up? `epsHits`/`salesHits`/`marginHits` = how many steps each metric moved up in
     (each out of `totalChecks / 3`). `hits` = the three summed. `totalChecks` = 3 × step count.
     `ratio = hits / totalChecks`. `stars = ratio * 5`. All four counts are carried on
     `Code33Score` (not just the derived `ratio`/`stars`) so the UI can always show *which*
     metric is carrying the score, not just the total — "EPS 1/3 · Sales 2/3 · Margin 1/3"
     explains a "4 of 9" in a way the bare total can't (both a perfectly even 4/9 split across
     metrics and a lopsided one — one metric maxed out, the others at zero — land on the same
     total).
  5. `code33Verdict()` bands the ratio into a label (Full Code 33 / Strong / Mixed / Weak / No
     acceleration), qualified with "(based on N of 3 steps)" when `partial`.
  6. `metricTone(hits, total)` bands one metric's own hit rate the same majority-rule way: all
     hits → green, none → red, anything between → amber. Compares `hits * 3 >= total * 2` rather
     than `hits / total >= 0.67`, since `total` is always small (1–3) and 2/3 as a float
     (`0.6666...`) would otherwise be wrongly excluded from "good." Shared by every place that
     colours a per-metric *fraction* — the live hover-card breakdown and the frozen Trade Detail
     breakdown's `EPS`/`Sales`/`Margin` rows.
  7. `buildQuarterTones(steps)` bands one metric's own boolean flag *per quarter* instead of a
     fraction — a quarter only appears in the returned `period -> {eps, sales, margin}` map if
     it's the `toPeriod` of some step, and its tone is that flag directly (`good` if
     accelerated/expanded, `bad` if not — never `caution`, since there's nothing to average at
     this granularity). Shared by the live grid's per-cell colouring (`QuarterlyGrid`, fed
     `rating.steps`) and a placed trade's frozen quarterly table (`TradeDetailPage`, fed
     `Code33Snapshot.steps`) — see [verify-fundamental.spec.md](verify-fundamental.spec.md) and
     [trade-detail.spec.md](trade-detail.spec.md) — so the exact same quarters colour the exact
     same way whether the read is live or replayed.

- **`Code33Score`** — the subset of `Code33Rating` that doesn't depend on having real
  `Code33Step[]` data: `status`, `ratio`, `stars`, `hits`, `totalChecks`, `epsHits`,
  `salesHits`, `marginHits`. `code33Verdict()` and `metricTone()`-consuming UI take this
  narrower shape rather than the full `Code33Rating`, so a frozen `Code33Snapshot` (see
  [trades.spec.md](trades.spec.md)) satisfies it structurally too. `Code33Rating extends
  Code33Score` by adding `steps: Code33Step[]`, needed by `buildQuarterTones()` — which is why
  `Code33Snapshot` freezes its own `steps` (as `TradeCode33Step[]`, trades' own inlined mirror
  of `Code33Step`) rather than leaving them out the way the narrower `Code33Score` shape does:
  the frozen quarterly table needs the same per-cell colouring the live one gets.

- **`toCode33Snapshot(rating, quarters)`** — freezes a live `Code33Rating` **plus its raw
  `quarters` and its `steps`** into a `Code33Snapshot` at trade placement (mirrors
  `toRatingSnapshot()` in `place-trade/utils/tradeRating.ts` for the score half; `quarters` and
  `steps` have no equivalent there, since a trade rating has no analogous "raw source data" or
  "per-quarter judgement" to preserve). `steps` is copied straight from `rating.steps` — frozen,
  not recomputed from the frozen `quarters` on read, so a later change to the acceleration
  formula can't make a placed trade's per-quarter colouring disagree with its own frozen
  `hits`/`epsHits`/etc. Returns `null` for a `pending` rating: there's no read worth freezing
  when there wasn't enough data to judge yet — neither the raw quarters nor the steps are
  preserved in that case, since the whole point is being available to the *snapshot*, and there
  isn't one. Re-derives each quarter's numbers via `deriveQuarters(quarters)` rather than a bare
  `Number()` parse, so a blank field freezes as `null` (not entered), never a misleading `0`.
  See `Code33Snapshot` / `TradeQuarterFinancials` / `TradeCode33Step` in
  [trades.spec.md](trades.spec.md) and the placement flow in
  [place-trade.spec.md](place-trade.spec.md).

- **`deriveQuarters()` accepts either raw or already-parsed figures.** Its parameter type
  (`sales`/`netProfit`/`eps` each `string | number | null`) is structurally satisfied by both
  the live `QuarterFinancials` (raw typed strings, for an editable grid) and the frozen
  `TradeQuarterFinancials` (already-parsed numbers or `null`, nothing left to edit) — so Trade
  Detail can call `deriveQuarters(setup.fundamentals.quarters)` directly to reconstruct a
  placed trade's full quarterly table (margins, YoY growth) without a second parsing path that
  could drift from the live one. See [trade-detail.spec.md](trade-detail.spec.md).

  Because YoY needs a same-quarter match 12 months back, the 4-quarter evaluation window alone
  is never enough data to compute anything — each of those 4 needs its own prior-year match, so
  a *complete* read needs 8 quarters (~2 years) of history. That's exactly why the grid's default
  `quarterCount` is 8, not 4 (see Data above) — the common case is scoreable without any extra
  clicks. Entering fewer than 8, or entering 8 with a gap, still degrades gracefully to `partial`
  or `pending` rather than a false "no acceleration" read.

  This is a deliberately simpler, bespoke shape than `place-trade`'s gate+criteria
  `TradeRating` (see [place-trade.spec.md](place-trade.spec.md)) — that machinery blends many
  unrelated signals with hard caps; Code 33 is one formula over one data source, so a single
  explainable fraction is enough. A tie like "2 of 3 steps fully accelerating" and "3 steps each
  2-of-3 accelerating" — both 6 of 9 checks — deliberately score the same rather than adding a
  second weighting layer.

- **Never frozen — on the watchlist/verify-fundamental side.** The user returns every quarter
  and adds a row, so `computeCode33()` runs live off the stored raw `quarters` on every call.
  Only the raw quarters are ever persisted here. A trade placed against the stock *does* freeze
  a one-time snapshot of the result at that moment (`toCode33Snapshot()`, above) — that's a
  genuine "moment of commitment," the same distinction `TradeRatingSnapshot` draws for the
  technical rating (see [trades.spec.md](trades.spec.md)), just arriving via a different
  module's data instead of a live recomputation.

## Behaviour

- **One record per watchlist item.** `fetchFundamentalsFor(watchlistItemId)`
  (`GET /fundamentals?watchlistItemId=…`) is the lookup; there is no record without a watchlist
  item behind it.
- **A record is deleted, never orphaned**, in two places:
  1. the watchlist item is **removed** (`WatchlistPage`, via `useFundamentals().removeFor`) —
     nothing left to attach it to;
  2. a trade is **placed** against it (`usePlaceTrade`'s `placeTrade()`, via
     `removeFundamentals()` directly) — the watchlist item is gone the same way, just through a
     different removal path (`removeItem` called straight from the stepper, not through
     `WatchlistPage`'s remove handler), which is why this needed its own explicit cleanup call
     rather than being covered by path 1. See [place-trade.spec.md](place-trade.spec.md).
- **Nothing is ever "submitted."** Unlike a place-trade draft, there's no consuming action that
  converts or discards the record — it's autosaved indefinitely as
  [verify-fundamental.spec.md](verify-fundamental.spec.md) edits it.

## Module map

```
frontend/src/modules/fundamentals/
├── types/fundamentals.ts    # QuarterFinancials, FundamentalsRecord, NewFundamentalsRecord
├── api/fundamentalsApi.ts   # fetchFundamentals, fetchFundamentalsFor, createFundamentals, updateFundamentals, removeFundamentals
├── hooks/useFundamentals.ts # every record, indexed byWatchlistItemId, + removeFor() — for the Watchlist page
├── utils/
│   ├── quarterlyCalc.ts     # deriveQuarters(), priorYearPeriod(), formatPeriodLabel()
│   └── code33.ts            # CODE33_STARS, computeCode33(), code33Verdict(), metricTone(), buildQuarterTones(), toCode33Snapshot()
├── components/
│   └── Code33Badge.tsx      # the watchlist row's compact indicator (muted / mini stars + score)
└── index.ts                 # barrel
```

`createFundamentals` / `updateFundamentals` stamp `updatedAt`. The per-page autosave hook that
drives them lives with the page that owns the state
(`verify-fundamental/hooks/useFundamentalsAutosave.ts`), not here — same split as `drafts` and
`place-trade/hooks/useDraftAutosave.ts`.

`Code33Badge` renders `shared/components/RatingStars` (promoted out of `place-trade` in this
change so both `place-trade` and `fundamentals` can use it without a cross-module import cycle —
`place-trade` already depends on `watchlist`, and `watchlist` depends on `fundamentals`, so
`fundamentals` importing anything from `place-trade` would cycle back).

`utils/code33.ts` imports the `Code33Snapshot` type from `modules/trades` for
`toCode33Snapshot()`'s return type — the one place this module reaches outside itself besides
`shared/`. See the Purpose section above for why this doesn't create a cycle.
