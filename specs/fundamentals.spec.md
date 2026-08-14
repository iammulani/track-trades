# Fundamentals — Spec

## Purpose

Quarterly financials (Sales, Net Profit, EPS) captured against a watchlist item, plus the
derivation of Mark Minervini's **"Code 33"** — a company is hitting on all cylinders when EPS
growth, Sales growth, and Net Profit Margin all accelerate together for 3 consecutive quarters.
The user types only the raw figures off a source like screener.in; every percentage and the
final star rating is computed, never entered.

Domain-only module: no page, no route. It's the data layer that
[verify-fundamental.spec.md](verify-fundamental.spec.md) (captures and edits the figures) and
[watchlist.spec.md](watchlist.spec.md) (surfaces the rating on the row) both consume — see
convention 7 in [`../CLAUDE.md`](../CLAUDE.md). Both of those import it, so **`fundamentals`
imports neither** — it stays a leaf, the same arrangement as [drafts.spec.md](drafts.spec.md).

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
     (each out of `steps.length`). `hits` = the three summed. `totalChecks` = 3 × step count.
     `ratio = hits / totalChecks`. `stars = ratio * 5`. All four counts are carried on
     `Code33Rating` (not just the derived `ratio`/`stars`) so the UI can always show *which*
     metric is carrying the score, not just the total — "EPS 1/3 · Sales 2/3 · Margin 1/3"
     explains a "4 of 9" in a way the bare total can't (both a perfectly even 4/9 split across
     metrics and a lopsided one — one metric maxed out, the others at zero — land on the same
     total).
  5. `code33Verdict()` bands the ratio into a label (Full Code 33 / Strong / Mixed / Weak / No
     acceleration), qualified with "(based on N of 3 steps)" when `partial`.

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

- **Never frozen.** Unlike `TradeRatingSnapshot` (frozen at trade placement — see
  [place-trade.spec.md](place-trade.spec.md)), Code 33 has no "moment of commitment." The user
  returns every quarter and adds a row, so `computeCode33()` runs live off the stored raw
  `quarters` on every call. Only the raw quarters are ever persisted.

## Behaviour

- **One record per watchlist item.** `fetchFundamentalsFor(watchlistItemId)`
  (`GET /fundamentals?watchlistItemId=…`) is the lookup; there is no record without a watchlist
  item behind it.
- **A record is deleted, never orphaned**, in one place: the watchlist item is **removed**
  (`WatchlistPage`, via `useFundamentals().removeFor`) — nothing left to attach it to.
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
│   └── code33.ts            # CODE33_STARS, computeCode33(), code33Verdict()
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
