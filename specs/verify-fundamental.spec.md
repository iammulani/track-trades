# Verify Fundamental — Spec

## Purpose

Lets the trader check a watchlist symbol's fundamentals against Mark Minervini's "Code 33" —
type in quarterly Sales, Net Profit and EPS, and see growth %, margin, and the Code 33 rating
worked out live. Unlike Place Trade, it never consumes the watchlist item: it's a repeat-visit
enrichment (add a quarter next earnings season), not a one-shot conversion.

## Data

- Reads the watchlist item via `useWatchlist()`, matched by the `:id` route param — same
  no-separate-fetch pattern `usePlaceTrade` uses (see
  [place-trade.spec.md](place-trade.spec.md)).
- Reads/writes its `FundamentalsRecord` via `modules/fundamentals` — see
  [fundamentals.spec.md](fundamentals.spec.md) for the raw shape and the Code 33 formulas.
  Writes continuously through `useFundamentalsAutosave` (debounced POST-then-PATCH), not on a
  submit action — there isn't one.

## UI

Reached from the watchlist row's **Verify Fundamental** pill or **Fundamentals** badge, at
`/watchlist/:id/verify-fundamental`. A single full page — the content (a growing quarterly grid
plus a rating breakdown) outgrows what `shared/Modal` comfortably holds, and unlike Place Trade
there's no sequence of gated steps to walk through, so it isn't a stepper either: one
continuously-editable form.

1. **Header** (`shared/PageHeader`) — `bars` icon + "Verify Fundamental" + subtitle.
2. **Title row** — the item's `SideBadge` + symbol, and a single **"As of"** date field
   (`AsOfPicker`, `<input type="date">`, capped at today, **defaults to today** — a fresh visit
   is almost always "check this stock now," so the grid is populated from the moment the page
   loads, not a blank prompt). The trader picks any date, not a quarter directly — `AsOfPicker`
   derives the most recent calendar quarter that had **already closed** by that date
   (Mar/Jun/Sep/Dec-ending) and that's what actually anchors the grid.
   Picking a date inside a quarter still resolves to the one before it: Aug 14 → Jun, and even
   Jun 29 → Mar, since the Apr–Jun quarter isn't done until Jun 30. This is deliberate — a free
   date is the natural thing to pick ("as of today", "as of when I placed that trade"), but the
   grid itself must only ever land on real reporting periods, never on an arbitrary month no
   company reports on. The input re-displays the resolved quarter's end date after each pick
   (e.g. picking anything in Aug snaps the field's own value to `2026-06-30`), so what's actually
   anchoring the grid is always visible, not hidden behind the pick. This also means the anchor
   isn't limited to today — a past date works the same way, so a stock's fundamentals can be
   checked as they stood on the day of an old trade, not only the present. Picking a new "as of"
   date resets the grid back to its default 8-quarter window — extending history is a deliberate
   follow-up action on that anchor, not something a fresh pick should carry over.
   The title row also carries the compact **Code 33 rating** (`Code33Summary`) — `RatingStars`
   (from `shared/components`) + `N.N / 5`, sitting right after the symbol. It's a `HoverCard`
   trigger (same collapsed-by-default pattern as `TradeRatingBadge`), not a permanent page
   section — see point 5.
3. **"Show 4 earlier quarters"** button, directly above the grid — grows the window backward
   4 quarters at a time without moving "as of" or disturbing anything already entered. Hidden
   until an "as of" quarter is picked.
4. **Quarterly grid** (`QuarterlyGrid`) — one row per generated quarter, oldest → newest,
   `quarterCount` rows ending at "as of" (starts at 8 — see Behaviour for why). Columns:
   `Quarter` (read-only, formatted "Jun 2026"), `Sales`, `Net Profit`, `EPS` (number inputs, the
   only editable cells), then three read-only derived columns — `Net Margin`, `Sales YoY`,
   `EPS YoY` — that update live as the three inputs are typed, formatted with
   `shared/utils/format`'s `formatPercent`/`formatSignedPercent`. A derived cell reads "—" until
   there's enough data to compute it (a blank row, or no same-quarter-prior-year row yet).

   **Each derived cell is colour-coded** — this is the primary way "did this accelerate" reads,
   not a separate breakdown section: `is-good` (green, `--good-text`) if that metric moved up
   relative to the previous quarter *in the evaluation window*, `is-bad` (red, `--critical-text`)
   if it moved down, uncoloured if there's no prior-quarter-in-window comparison yet (the
   window's own earliest quarter, or any quarter without YoY data at all). The tone per cell
   comes straight from `rating.steps` (passed in as a `rating` prop) — `QuarterlyGrid` builds a
   `period -> {eps, sales, margin}` tone map keyed by each step's `toPeriod`, so a cell's colour
   and the hover-card breakdown behind the title-row badge can never disagree; they're reading
   the same `Code33Step` array.

   The `Net Margin` header carries an info `HoverCard` (not a native `title` — a native tooltip
   proved unreliable to trigger in practice) spelling out the formula: "Net Profit ÷ Sales × 100,
   for this quarter." Before an "as of" quarter is picked, the grid shows a prompt instead of an
   empty table.
5. **Code 33 detail** — lives behind the title row's rating badge (point 2), not as a page
   section. Hovering it reveals a small structured panel, not a run of plain text:
   - The verdict as a tone-coloured **pill** (e.g. "Mixed — some cylinders firing", or "Not
     enough consecutive quarters yet…" when `pending`), not inline text — it's the headline of
     the panel, so it gets the visual weight.
   - Except when `pending` (nothing to count yet), a fixed-wording summary sentence — **"Checked
     whether EPS, Sales, and Margin each improved quarter-over-quarter across N quarters
     (totalChecks checks) — hits passed."** — at comfortable body size/line-height, not the
     small muted caption size everything used to share.
   - A per-metric breakdown underneath, separated by a rule: three rows (`EPS`, `Sales`,
     `Margin`), each showing its own `hits/N` as a small tone-coloured pill, right-aligned —
     `metricTone()` bands each row the same way `code33Verdict()` bands the overall score (all
     hits → green, none → red, some → amber), so "which cylinder is actually carrying the score"
     reads at a glance instead of requiring three numbers to be parsed out of one sentence.
     Compares `hits * 3 >= total * 2` rather than `hits / total >= 0.67` — `total` is always
     small (1–3 steps), and 2/3 as a float is `0.6666...`, which a `>= 0.67` check would wrongly
     exclude from "good."

   All figures are read straight off `rating.hits`/`totalChecks`/`epsHits`/`salesHits`/
   `marginHits` (see [fundamentals.spec.md](fundamentals.spec.md)), with the summary's wording
   fixed in code, not composed as prose, so nothing here can drift or vary between renders. A
   per-*step* list (each step's own EPS/Sales/Margin figures) used to live here too, but once the
   grid itself started colour-coding those same cells (point 4), it read as duplicated,
   harder-to-parse detail — the grid *is* the per-quarter breakdown now; the hover explains the
   aggregate score.
6. **Footer** — a "← Back to Watchlist" link, and the autosave status ("Saving…" /
   "Saved · <time>"), same language as Place Trade's draft-status footer.

**States**: loading → "Loading…"; error → message; item not found (already placed or removed) →
message + back link — same three states as `PlaceTradePage`.

## Behaviour

- **No manual add/remove-row control, and no per-row date entry.** The grid is *generated* from
  two controls: "as of" (the most recent quarter, always a fixed Mar/Jun/Sep/Dec quarter-end —
  see UI) and a quarter count that starts at **8**, and grows 4 at a time via "Show earlier
  quarters" (picking `Jul – Sep 2026` as-of with the default count generates `Dec 2024, Mar
  2025, Jun 2025, Sep 2025, Dec 2025, Mar 2026, Jun 2026, Sep 2026`; clicking "Show earlier
  quarters" once prepends 4 more, back to `Dec 2023`, → 12 rows). The default is 8, not 4,
  because Code 33's 4-quarter step-window only produces a score once each of those 4 quarters
  has its own same-quarter-prior-year match for the YoY comparison — 4 quarters alone can never
  find one, so they'd all read `pending` forever (see
  [fundamentals.spec.md](fundamentals.spec.md)). Changing "as of" resets the count back to 8 and
  regenerates from the new anchor.
- **Autosaved, never submitted.** Every change ("as of", the quarter count, or any cell)
  debounce-writes back to `/fundamentals` (POST the first time, PATCH after) via
  `useFundamentalsAutosave` — a direct structural copy of `place-trade`'s `useDraftAutosave`
  adapted to a `{asOfPeriod, quarterCount, quarters}` payload. A page opened and closed untouched
  writes nothing. Only quarters with at least one non-empty value are ever persisted; a fully
  blank generated row exists only in the rendered grid, not in storage.
- **A save can never fire against stale, pre-hydration local state.** Hydration finishing
  (`useFundamentalsAutosave`'s `hydrating` flipping false) and `useVerifyFundamental` finishing
  seeding its local state *from* that hydrated record are two separate renders, not one — so
  gating only on `hydrating` leaves a one-render window where the debounce effect sees
  `hydrating: false` and a `recordId` already assigned, but `state` still holding the pristine
  defaults, which used to be enough to schedule (and, on an unlucky timing, actually fire) a save
  that overwrote a real record with an empty one. `useVerifyFundamental` closes this with an
  explicit `seeded` flag, set true in the *same* effect that finishes the local-state catch-up
  (never in a separate one), and passes it into `useFundamentalsAutosave` as a `ready` param that
  both the scheduling effect and `save()` itself check first — the unmount-flush path calls
  `save()` directly, unscheduled, so the guard has to live in `save()` too, not only in the
  effect that normally calls it. `loading` also waits on `seeded`, not just `hydrating`, so the
  grid can't flash the pristine default for a frame before the real values land.
- **Never removes or converts the watchlist item.** There is no submit, no "Place Trade"-style
  consuming action, and no discard — the record just keeps accumulating quarters over time. The
  item's removal (and therefore this record's deletion) is handled entirely by
  [watchlist.spec.md](watchlist.spec.md)'s remove flow.
- Reloading the page rehydrates "as of", the quarter count, and every entered value from the
  saved record.

## Module map

```
frontend/src/modules/verify-fundamental/
├── VerifyFundamentalPage.tsx          # loads the item, header, title row + as-of picker, "show earlier" button, grid, summary, footer
├── VerifyFundamentalPage.css
├── hooks/
│   ├── useFundamentalsAutosave.ts     # hydrate from /fundamentals, debounce-write back — copy of useDraftAutosave.ts
│   └── useVerifyFundamental.ts        # owns asOfPeriod/quarterCount/quarters state, showEarlierQuarters(), updateQuarter(), computeCode33() memo
├── utils/
│   ├── generateQuarters.ts            # generateQuarterPeriods(asOfPeriod, quarterCount) -> ordered "YYYY-MM" periods, stepping back from asOfPeriod
│   └── previousQuarter.ts             # previousQuarterPeriod(dateValue), quarterEndDateValue(period) — the date <-> quarter-end math AsOfPicker and the default-to-today anchor both use
├── components/
│   ├── AsOfPicker.tsx(+.css)          # <input type="date"> -> previousQuarterPeriod() resolves it to the last closed Mar/Jun/Sep/Dec quarter
│   ├── QuarterlyGrid.tsx(+.css)       # the generated grid: editable Sales/Net Profit/EPS + colour-coded derived columns (tone map built from rating.steps)
│   └── Code33Summary.tsx(+.css)       # compact stars + score for the title row; HoverCard reveals just the verdict line (mirrors TradeRatingBadge's collapsed-by-default shape, not its content)
└── index.ts                           # exports VerifyFundamentalPage
```

Depends on `modules/fundamentals` (the data + Code 33 derivation) and `modules/watchlist`
(`useWatchlist`, to resolve the item by `:id`) — same shape of dependency `place-trade` has on
`drafts` and `watchlist`. Route registered in `frontend/src/app/routes.tsx` next to
`place-trade`'s.
