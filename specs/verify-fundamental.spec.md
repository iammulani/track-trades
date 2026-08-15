# Verify Fundamental — Spec

## Purpose

Lets the trader check a watchlist symbol's fundamentals — one metric per **tab**. So far: Mark
Minervini's "Code 33" (type in quarterly Sales, Net Profit and EPS, and see growth %, margin, and
the rating worked out live), **Debt to Equity** (type in annual Borrowings/Equity Capital/Reserves
off the Balance Sheet, and see the ratio and a fixed safe/watch/fragile colour read), and
**Interest Coverage** (type in quarterly Operating Profit and Interest, and see whether the
business can comfortably afford what it owes, same fixed-colour-band treatment as Debt to
Equity). More tabs get added the same way as more metrics are specified — see
[fundamentals.spec.md](fundamentals.spec.md). Unlike Place Trade, it never consumes the watchlist
item: it's a repeat-visit enrichment (add a quarter or a year next reporting season), not a
one-shot conversion.

## Data

- Reads the watchlist item via `useWatchlist()`, matched by the `:id` route param — same
  no-separate-fetch pattern `usePlaceTrade` uses (see
  [place-trade.spec.md](place-trade.spec.md)).
- Reads/writes its `FundamentalsRecord` via `modules/fundamentals` — see
  [fundamentals.spec.md](fundamentals.spec.md) for the raw shape and the Code 33, Debt to Equity,
  and Interest Coverage formulas. One record holds all three metrics' data — the quarterly
  `asOfPeriod`/`quarterCount`/`quarters` trio serves **both** Code 33 and Interest Coverage
  (`operatingProfit`/`interest` live directly on each `QuarterFinancials` row), while the annual
  `debtEquityAsOfYear`/`debtEquityYearCount`/`debtEquityYears` trio is Debt to Equity's own — so
  there's one autosave path for the whole page, not one per tab. Writes continuously through
  `useFundamentalsAutosave` (debounced POST-then-PATCH), not on a submit action — there isn't one.

## UI

Reached from the watchlist row's **Verify Fundamental** pill or **Fundamentals** badge, at
`/watchlist/:id/verify-fundamental`. A single full page — the content (a growing quarterly grid
plus a rating breakdown) outgrows what `shared/Modal` comfortably holds, and unlike Place Trade
there's no sequence of gated steps to walk through, so it isn't a stepper either: one
continuously-editable form.

1. **Header** (`shared/PageHeader`) — `bars` icon + "Verify Fundamental" + subtitle, with a
   **"What is Code 33?"** pill in the header's actions slot (`Code33Explainer`). A `HoverCard`
   trigger (`info` icon + label, `hover-card__trigger--plain`) revealing a fixed, generic
   reminder of what the three metrics mean and why all three matter together, plus an explicit
   "what Code 33 does NOT tell you" section (debt, cash flow, valuation, durability) — the
   blind spots worth knowing before treating a high score as the whole picture. Deliberately
   **not** built from the watchlist item currently open — a made-up example (₹100 billed → ₹9
   profit) rather than that stock's real numbers, so the same reminder shows every time this
   page is opened, for any stock, rather than needing the current item's figures to make sense.
   Content and styling mirror the worked-example `HoverCard`s already used in `place-trade`
   (e.g. `FinalChecksStep`'s "More about overhead supply") — own CSS in this module, not shared,
   since the class names are bespoke to this one panel's sections.
2. **Title row** — the item's `SideBadge` + symbol, the compact **Code 33 rating**
   (`Code33Summary`) — `RatingStars` (from `shared/components`) + `N.N / 5`, sitting right after
   the symbol, always shown regardless of which tab is active (see point 5 for the detail it
   reveals) — and a single **"As of"** field whose control depends on the active tab's period
   axis: on the Code 33 **and** Interest Coverage tabs (both quarterly, sharing the exact same
   rows — see Data above), `AsOfPicker` (`<input type="date">`, capped at today, **defaults to
   today** — a
   fresh visit is almost always "check this stock now," so the grid is populated from the moment
   the page loads, not a blank prompt). The trader picks any date, not a quarter directly —
   `AsOfPicker` derives the most recent calendar quarter that had **already closed** by that date
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
   On the Debt to Equity tab, `AsOfYearPicker` instead — a plain `<input type="number">` year
   field capped at the current year, **defaults to the current year**. A year needs no "resolve to
   the last closed period" logic the way a quarter does (a typed year already is the reporting
   period), so it's a simpler control than `AsOfPicker`. Picking a new year resets that tab's
   window back to its default 7-year span, same reset-on-new-anchor rule the Code 33 tab follows.
3. **Tabs** (`FundamentalsTabs`) — a `role="tablist"` pill bar directly under the title row:
   **Code 33**, **Debt to Equity**, and **Interest Coverage** so far, more to come as further
   metrics are specified (see [fundamentals.spec.md](fundamentals.spec.md)). Switching tabs only
   changes which section below renders — the title row above it (symbol, Code 33 rating, "as of"
   control) stays in place.
4. **Code 33 tab**:
   1. **"Show 4 earlier quarters"** button, directly above the grid — grows the window backward
      4 quarters at a time without moving "as of" or disturbing anything already entered. Hidden
      until an "as of" quarter is picked.
   2. **Quarterly grid** (`QuarterlyGrid`) — one row per generated quarter, oldest → newest,
      `quarterCount` rows ending at "as of" (starts at 8 — see Behaviour for why). Columns:
      `Quarter` (read-only, formatted "Jun 2026"), `Sales`, `Net Profit`, `EPS` (number inputs,
      the only editable cells), then four read-only derived columns — `Net Margin`, `Net Margin
      YoY`, `Sales YoY`, `EPS YoY` — that update live as the three inputs are typed, formatted
      with `shared/utils/format`'s `formatPercent`/`formatSignedPercent`/`formatSignedPoints`. A
      derived cell reads "—" until there's enough data to compute it (a blank row, or no
      same-quarter-prior-year row yet). `Net Margin YoY` — `QuarterDerived.netMarginChangeYoY`,
      `netMargin` minus the same quarter last year's — is a **percentage-point** difference
      (`9.0% → 11.0%` reads `+2.0pp`), not a relative % change like the other two YoY columns;
      `formatSignedPoints()` exists specifically so this can't be misread as a `+22.2%` relative
      move. It carries its own `HoverCard` info note next to the header, same pattern as `Net
      Margin`'s. Uncoloured — it's informational context alongside the coloured `Net Margin` cell
      (which reflects the *sequential*-quarter comparison the score is actually built from), not
      a second scored comparison of its own.

      **Each derived cell is colour-coded** — this is the primary way "did this accelerate"
      reads, not a separate breakdown section: `is-good` (green, `--good-text`) if that metric
      moved up relative to the previous quarter *in the evaluation window*, `is-bad` (red,
      `--critical-text`) if it moved down, uncoloured if there's no prior-quarter-in-window
      comparison yet (the window's own earliest quarter, or any quarter without YoY data at
      all). The tone per cell comes straight from `rating.steps` (passed in as a `rating` prop)
      via `buildQuarterTones(steps)` (`modules/fundamentals`) — a `period -> {eps, sales,
      margin}` tone map keyed by each step's `toPeriod`. This is a *shared* function, not local
      to `QuarterlyGrid`: `TradeDetailPage` calls the exact same one (fed `Code33Snapshot.steps`
      instead of a live rating's) to colour a placed trade's frozen quarterly table the identical
      way — see [trade-detail.spec.md](trade-detail.spec.md) — so the live grid, the hover-card
      breakdown, and a frozen trade's table can never disagree on which quarters were good or
      bad.

      The `Net Margin` header carries an info `HoverCard` (not a native `title` — a native
      tooltip proved unreliable to trigger in practice) spelling out the formula: "Net Profit ÷
      Sales × 100, for this quarter." Before an "as of" quarter is picked, the grid shows a
      prompt instead of an empty table.
5. **Code 33 detail** — lives behind the title row's rating badge (point 2), not as a page
   section, and not gated by the active tab — it's always reachable, the same way the badge
   itself is always shown. Hovering it reveals a small structured panel, not a run of plain text:
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
6. **Debt to Equity tab**:
   1. **`DebtEquityExplainer`** — an **always-expanded static panel**, not a `HoverCard` like
      `Code33Explainer` (point 1). Deliberate: the trader is learning this ratio while typing
      figures in, so the question it answers, the formula, the colour bands, and a worked example
      have to stay on screen, not sit behind a trigger. Renders through the shared
      `MetricExplainer` shell (see point 7.1's `InterestCoverageExplainer` — the same component,
      just fed different content), passing: what question it answers ("how much of this business
      was built with borrowed money?"), where the numbers come from (Balance Sheet, annual), the
      formula (`Debt/Equity = Borrowings ÷ (Equity Capital + Reserves)`), the colour bands
      (`< 0.5` green Safe / `0.5–1.0` amber Watch / `> 1.0` red Fragile), and a plain-language
      worked example with why it matters. Deliberately kept to just those — a quick reference, not
      a longer explainer with caveats.
   2. **"Show 5 earlier years"** button, directly above the grid — grows the window backward 5
      years at a time without moving "as of" or disturbing anything already entered. Hidden until
      an "as of" year is picked.
   3. **Debt to Equity grid** (`DebtEquityGrid`) — one row per generated fiscal year, oldest →
      newest, `debtEquityYearCount` rows ending at "as of" (starts at 7 — see Behaviour). Columns:
      `Year` (read-only), `Borrowings`, `Equity Capital`, `Reserves` (number inputs, the only
      editable cells), then a read-only derived `Debt/Equity` column. Unlike Code 33's derived
      cells, this one **colours against a fixed threshold**
      (`debtEquityTone()`, [fundamentals.spec.md](fundamentals.spec.md)), not a computed hit
      ratio — `is-good`/`is-caution`/`is-bad` per the same bands the explainer panel documents.
      Purely informational: there's no aggregate score or star rating for this metric, only the
      per-year colour. A cell reads "—" until both `Equity Capital` and `Reserves` are entered
      and their sum is positive.
7. **Interest Coverage tab**:
   1. **`InterestCoverageExplainer`** — content rendered through the same shared `MetricExplainer`
      shell `DebtEquityExplainer` uses (point 6.1): what question it answers ("can they
      comfortably afford the interest they owe?"), where the numbers come from (Quarterly
      Results, every quarter), the formula (`Interest Coverage = Operating Profit ÷ Interest`),
      the colour bands (`< 3x` red Fragile / `3x–5x` amber Tight / `> 5x` green Comfortable), and
      a plain-language worked example. Its "why it matters" text deliberately ties back to Debt to
      Equity by name — the two are meant to be read together, not in isolation: D/E says how much
      debt there is, this says whether it can be afforded.
   2. **"Show 4 earlier quarters"** button — the *exact same* button/state
      `showEarlierQuarters()`/`quarterCount` the Code 33 tab uses (point 4.1), not a second one of
      its own, since both tabs share the same quarterly rows.
   3. **Interest Coverage grid** (`InterestCoverageGrid`) — one row per generated quarter, the
      same `rows` Code 33's grid renders (oldest → newest, `quarterCount` rows ending at "as of").
      Columns: `Quarter` (read-only, formatted "Jun 2026"), `Operating Profit`, `Interest`
      (number inputs, the only editable cells — stored directly on the shared `QuarterFinancials`
      row alongside Sales/Net Profit/EPS), then a read-only derived `Interest Coverage` column
      (formatted "N.NNx"), coloured against `interestCoverageTone()`'s fixed threshold the same
      way `DebtEquityGrid`'s ratio column is — `is-good`/`is-caution`/`is-bad`. Purely
      informational, no aggregate score.
8. **Footer** — a "← Back to Watchlist" link, and the autosave status ("Saving…" /
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
- **Debt to Equity's grid follows the identical generated/sparse/autosave pattern as Code 33's,
  just on an annual axis, and independently of it.** `debtEquityYearCount` starts at **7** (not a
  minimum-for-a-score number the way Code 33's 8 is — each year derives independently, so even a
  single filled-in year is fully readable; 7 is just "enough years to eyeball a trend") and grows
  **5** at a time via "Show earlier years." Picking a new `debtEquityAsOfYear` resets the count
  back to 7. Only years with at least one non-empty value are written back. Switching tabs never
  clears or resets the other tab's state — `useVerifyFundamental` holds both the quarterly and
  annual state at once, and `useFundamentalsAutosave` writes them together as one record, so
  typing into one tab and switching away mid-edit doesn't lose anything.
- **Interest Coverage shares Code 33's quarterly rows outright rather than tracking its own
  copy.** `operatingProfit`/`interest` live directly on the same `QuarterFinancials` object each
  row already carries `sales`/`netProfit`/`eps` on — one `updateQuarter(period, patch)` call
  handles a patch to either tab's fields, and the sparse-write check that decides whether a quarter
  is worth persisting looks at all five fields, not just Code 33's three. A quarter saved before
  Interest Coverage existed simply lacks `operatingProfit`/`interest` on read; both
  `useVerifyFundamental`'s seeding effect and `useFundamentalsAutosave`'s own `savedKeyRef`
  computation backfill those two fields to `''` the same way (same key order, so an untouched
  legacy quarter can never be mistaken for a change and trigger a spurious save the instant the
  page loads — the same failure mode already fixed once for the Debt to Equity fields, and fixed
  the identical way here).

## Module map

```
frontend/src/modules/verify-fundamental/
├── VerifyFundamentalPage.tsx          # loads the item, header, title row + as-of control, tabs, per-tab section, footer
├── VerifyFundamentalPage.css
├── hooks/
│   ├── useFundamentalsAutosave.ts     # hydrate from /fundamentals, debounce-write back — copy of useDraftAutosave.ts
│   └── useVerifyFundamental.ts        # owns asOfPeriod/quarterCount/quarters *and* debtEquityAsOfYear/debtEquityYearCount/debtEquityYears state,
│                                       #   showEarlierQuarters()/updateQuarter()/computeCode33() memo, showEarlierDebtEquityYears()/updateDebtEquityYear()
├── utils/
│   ├── generateQuarters.ts            # generateQuarterPeriods(asOfPeriod, quarterCount) -> ordered "YYYY-MM" periods, stepping back from asOfPeriod
│   ├── previousQuarter.ts             # previousQuarterPeriod(dateValue), quarterEndDateValue(period) — the date <-> quarter-end math AsOfPicker and the default-to-today anchor both use
│   └── generateYears.ts               # generateYearPeriods(asOfYear, yearCount) -> ordered "YYYY" periods, stepping back from asOfYear — annual analogue of generateQuarters.ts
├── components/
│   ├── AsOfPicker.tsx(+.css)          # <input type="date"> -> previousQuarterPeriod() resolves it to the last closed Mar/Jun/Sep/Dec quarter
│   ├── AsOfYearPicker.tsx(+.css)      # <input type="number"> year field, capped at the current year — no resolution logic needed
│   ├── QuarterlyGrid.tsx(+.css)       # the generated grid: editable Sales/Net Profit/EPS + colour-coded derived columns (tone map built from rating.steps)
│   ├── Code33Summary.tsx(+.css)       # compact stars + score for the title row; HoverCard reveals just the verdict line (mirrors TradeRatingBadge's collapsed-by-default shape, not its content)
│   ├── Code33Explainer.tsx(+.css)     # header's "What is Code 33?" HoverCard — fixed generic reminder of the 3 metrics + the blind spots, not built from the current item's data
│   ├── FundamentalsTabs.tsx(+.css)    # role="tablist" bar switching between metric sections — Code 33 / Debt to Equity / Interest Coverage so far
│   ├── MetricExplainer.tsx(+.css)     # shared always-expanded panel shell (question/where, formula+colour-bands, example+why) — content-only props, no HoverCard
│   ├── DebtEquityGrid.tsx(+.css)      # the generated grid: editable Borrowings/Equity Capital/Reserves + one derived Debt/Equity column, fixed-threshold colour
│   ├── DebtEquityExplainer.tsx        # DebtEquityGrid's reference content, rendered through MetricExplainer
│   ├── InterestCoverageGrid.tsx(+.css)# the generated grid: editable Operating Profit/Interest + one derived Interest Coverage column, fixed-threshold colour — reuses Code 33's rows
│   └── InterestCoverageExplainer.tsx  # InterestCoverageGrid's reference content, rendered through MetricExplainer
└── index.ts                           # exports VerifyFundamentalPage
```

Depends on `modules/fundamentals` (the data + Code 33, Debt to Equity, and Interest Coverage
derivations) and `modules/watchlist` (`useWatchlist`, to resolve the item by `:id`) — same shape
of dependency `place-trade` has on `drafts` and `watchlist`. Route registered in
`frontend/src/app/routes.tsx` next to `place-trade`'s.
