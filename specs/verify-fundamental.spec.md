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
3. **"Show 4 earlier quarters"** button, directly above the grid — grows the window backward
   4 quarters at a time without moving "as of" or disturbing anything already entered. Hidden
   until an "as of" quarter is picked.
4. **Quarterly grid** (`QuarterlyGrid`) — one row per generated quarter, oldest → newest,
   `quarterCount` rows ending at "as of" (starts at 8 — see Behaviour for why). Columns:
   `Quarter` (read-only, formatted "Jun 2026"), `Sales`, `Net Profit`, `EPS` (number inputs, the
   only editable cells), then three read-only derived columns — `Net Margin`, `Sales YoY`,
   `EPS YoY` — that update live as the three inputs are typed, formatted with
   `shared/utils/format`'s `formatPercent`/`formatSignedPercent`. A derived cell reads "—" until
   there's enough data to compute it (a blank row, or no same-quarter-prior-year row yet). Before
   an "as of" quarter is picked, the grid shows a prompt instead of an empty table.
5. **Code 33 summary** (`Code33Summary`) — `RatingStars` (from `shared/components`) sized larger
   + `N.N / 5` + a verdict pill (tone-coloured: good / caution / bad), then a plain list of every
   step in the evaluation window (`Jun 2025 → Sep 2025`, with a check/✕ per metric) so the score
   is never a black box. Nothing renders here if fewer than 2 usable quarters exist yet — the
   verdict pill itself explains what's missing and points at "Show earlier quarters."
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
│   ├── QuarterlyGrid.tsx(+.css)       # the generated grid: editable Sales/Net Profit/EPS + read-only derived columns
│   └── Code33Summary.tsx(+.css)       # RatingStars + score + verdict + per-step breakdown
└── index.ts                           # exports VerifyFundamentalPage
```

Depends on `modules/fundamentals` (the data + Code 33 derivation) and `modules/watchlist`
(`useWatchlist`, to resolve the item by `:id`) — same shape of dependency `place-trade` has on
`drafts` and `watchlist`. Route registered in `frontend/src/app/routes.tsx` next to
`place-trade`'s.
