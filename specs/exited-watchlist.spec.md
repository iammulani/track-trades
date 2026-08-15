# Exited Watchlist — Spec

## Purpose

A permanent, reviewable log of stocks dropped from the active
[Watchlist](watchlist.spec.md). Removing a stock used to just delete it; now it's
**archived** here instead, carrying over everything captured while it was being
watched (side, category, notes, rating, link, and its fundamentals record if one
exists), plus **why** it was exited and an optional note. Because a symbol can be
watched, exited, and re-watched more than once over its life, entries here are
**never deduplicated** — the same symbol can appear many times, once per exit.

## Data

- **Source:** `GET /api/exited-watchlist` → the `exited-watchlist` resource in
  `backend/data/exited-watchlist.json`.
- **Raw shape** (`types/exitedWatchlistItem.ts`) — every field a
  [`WatchlistItem`](watchlist.spec.md) carries, as-is, plus the exit's own fields:

  | field               | type                                     | meaning                                              |
  | ------------------- | ----------------------------------------| ----------------------------------------------------- |
  | `id`                | string                                   | unique id                                             |
  | `symbol`            | string                                   | carried over from the watchlist item                  |
  | `category`          | `WatchCategory`                          | carried over — the reason it was being watched         |
  | `side`               | `WatchSide`                              | carried over                                          |
  | `watchedSince`      | string (ISO)                             | carried over — when it first went on the watchlist    |
  | `notes`             | `WatchNote[] \| string`?                 | carried over — the dated log from the watchlist item   |
  | `link`              | string?                                  | carried over                                          |
  | `rating`            | `0-5`?                                   | carried over — the manual rating at the time of exit   |
  | `fundamentals`      | `ExitedFundamentals`?                    | carried over — see below; absent if never captured     |
  | `exitReason`        | `ExitReason`                             | required — why it was exited, picked from a fixed list |
  | `exitNote`          | string?                                  | optional free-text note about the exit                |
  | `exitedAt`          | string (ISO)                             | when it was exited                                    |
  | `sourceWatchlistId` | string                                   | traceability only — **never** used for dedup           |

- **Exit reasons** (`utils/exitReasons.ts` — fixed order, the single source of truth
  for the exit modal's dropdown, the review list's filter, and any labels):

  Fundamentals Poor · Peer Comparison Failed · VCP / Base Failed · No Follow-Through
  After Breakout · Broke Key Support · Left Stage 2 Uptrend · Thesis Invalidated ·
  Too Extended / Late Entry · Better Setup Elsewhere · Sector Rotated Out · Low
  Liquidity · Lost Interest · Other.

- **`ExitedFundamentals`** (`types/exitedWatchlistItem.ts`) — the raw quarterly figures
  from [fundamentals.spec.md](fundamentals.spec.md)'s `FundamentalsRecord`, minus its
  `id`/`watchlistItemId`/`updatedAt` (meaningless once archived): `{ asOfPeriod,
  quarterCount, quarters }`. Only the raw quarters are carried, never a computed score —
  same "derive, don't store" rule the live record follows. Absent if Verify Fundamental
  was never opened for the item.
- **Derived — per item** (`utils/exitedMetrics.ts`):
  - `watchedDurationLabel(item)` = `exitedAt − watchedSince`, humanised through
    watchlist's `formatWatchedLabel`. This is deliberately **not** the watchlist's
    `watchedLabel` (which is `now − watchedSince`, and would keep growing after the
    symbol is no longer being watched).
  - The Code 33 badge (below) recomputes `computeCode33(item.fundamentals.quarters)`
    live on every render, straight from `modules/fundamentals` — not a separate
    exited-watchlist util, since the formula is exactly the live one.

## UI

Reached via the **Exited Watchlist** sidebar item (icon: archive), right below
Watchlist. Top to bottom:

1. **Header** (`shared/PageHeader`) — icon chip + title "Exited Watchlist" + one-line
   subtitle noting a symbol can appear more than once.
2. **Toolbar** — a ticker **search box** (shared `TickerSearch`, client-side, left)
   and a **reason filter** (`ReasonFilterSelect`, right) — a native `<select>`
   rather than pill tabs, since 13 reasons is too many for one scannable row. Shows
   `All reasons (<n>)` plus each reason with its own count. Reflected in the URL as
   `?reason=<value>`, omitted at its default ("all"). Search applies within the
   active reason filter, same composition rule as Watchlist's search-within-filter.
3. **Table** (`ExitedWatchlistTable`) — one row per exit, **newest exit first**.
   Entirely **read-only** except for deleting the row itself: `Stock` (avatar +
   symbol + link icon, same as Watchlist's), `Side` (`shared/SideBadge`),
   `Category` (an icon-only chip via `categoryMeta`, full name in the hover title —
   same compact treatment as the Watchlist's `CategorySelect` chip, just static
   since the category can't be changed after the fact),
   `Watched` (humanised `exitedAt − watchedSince`, full range in the hover title),
   `Rating` (read-only `shared/RatingStars` when rated, else "Unrated" — not the
   interactive `RatingStar`), `Notes` (an icon + count button, muted `—` when
   there are none — opens `ExitedNotesModal`, a read-only view of the dated log:
   same entries `NotesModal` shows live, no composer/edit/delete), `Fundamentals`
   (a Code 33 icon button, accent-tinted with the verdict as its hover title when
   `fundamentals` is present, muted `—` otherwise — opens `ExitedFundamentalsModal`,
   a read-only score + breakdown + quarterly grid computed live from the carried-over
   `quarters`. Unlike the Watchlist's `Code33Badge` this doesn't navigate anywhere —
   there's no live watchlist item left for a Verify Fundamental page to attach to,
   so the popup is the only place left to read the captured figures), `Exit Reason`,
   `Exit Note` (same icon treatment as `Notes` — accent-tinted when present, muted
   `—` otherwise — but hover-only, via shared `HoverCard` rather than a click-opened
   popup: it's a single short optional string, not a log worth a dedicated viewer,
   but still needs `HoverCard`'s panel over a native `title` — the note can run up
   to 280 characters, and a browser tooltip is slow to appear and easy to miss at
   that length), `Exited` (date, full timestamp in the hover title), and a delete (×)
   action.
4. **Delete confirmation** (`ConfirmDialog`, shared `Modal`) — shows the symbol
   prominently, same pattern as Watchlist's old remove confirmation. Confirming
   permanently deletes just this archived row — a leaf delete with no cascade
   (nothing else references an exited-watchlist id).

## Behaviour

- **Sorted by `exitedAt` descending** — the most recently dropped symbol is always
  on top.
- **Never deduplicated.** No uniqueness check anywhere in this module — the same
  symbol re-added to the watchlist and exited again produces a second, independent
  row here.
- **Append-only except for delete.** There is no edit action anywhere on this page;
  an archived record is a frozen snapshot of the watchlist item at the moment it
  left. The one mutation available is deleting the whole row (e.g. to clean up a
  mistaken exit) — see [watchlist.spec.md](watchlist.spec.md) for how a row gets
  created here in the first place.
- **States:** loading → "Loading…"; error → message; empty list → prompt that
  exits will show up here; empty filtered/search result → distinct messages
  ("No exits with this reason yet." vs `No tickers match "<query>".`).

## Module map

```
frontend/src/modules/exited-watchlist/
├── ExitedWatchlistPage.tsx        # composes header/toolbar/table; owns URL filter + search state
├── ExitedWatchlistPage.css
├── index.ts                       # exports ExitedWatchlistPage, useExitedWatchlist, addExitedWatchlistItem,
│                                   #   fetchExitedWatchlist, EXIT_REASONS, exitReasonLabel, types
├── types/exitedWatchlistItem.ts   # ExitedWatchlistItem, NewExitedWatchlistItem, ExitReason, ExitedFundamentals
├── api/exitedWatchlistApi.ts      # fetchExitedWatchlist, addExitedWatchlistItem, removeExitedWatchlistItem
├── hooks/useExitedWatchlist.ts    # fetch + removeItem, silent refetch
├── utils/
│   ├── exitReasons.ts             # EXIT_REASONS (fixed order), exitReasonLabel()
│   └── exitedMetrics.ts           # watchedDurationLabel() — exitedAt − watchedSince, via watchlist's formatWatchedLabel
└── components/
    ├── ExitedWatchlistTable.tsx     # the read-only table; owns the delete-confirmation + popup-open flow
    ├── ReasonFilterSelect.tsx       # native <select> filter with per-reason counts, URL-reflected
    ├── ExitedNotesModal.tsx         # popup: read-only dated notes log — no composer/edit/delete
    └── ExitedFundamentalsModal.tsx  # popup: read-only Code 33 score + breakdown + quarterly grid
```

Depends on `modules/watchlist`'s barrel for `WatchCategory`/`WatchSide`/`WatchNote`/
`WatchRating` types and the reused `categoryMeta`, `itemRating`, `itemNotes`,
`formatWatchedLabel` — a one-way dependency; `watchlist` never imports from here
(the modal that *creates* an entry, `ExitWatchlistModal`, lives in `modules/watchlist`
and imports `EXIT_REASONS`/`ExitReason` from this module's barrel instead — see
[watchlist.spec.md](watchlist.spec.md)). Also uses the shared `TickerSearch`
(promoted from `modules/watchlist` to `shared/components/` when this module needed
it too), shared `HoverCard` (the Exit Note column's hover panel), and
`modules/fundamentals`'s `computeCode33`/`code33Verdict` (table badge
+ modal), `deriveQuarters`/`buildQuarterTones`/`formatPeriodLabel`/`metricTone`/
`CODE33_STARS` (`ExitedFundamentalsModal`'s grid + breakdown) — the same leaf-module
relationship `watchlist` already has with `fundamentals` (see
[fundamentals.spec.md](fundamentals.spec.md)), just consumed from a second place.
Deliberately does **not** reuse `verify-fundamental`'s `QuarterlyGrid`/`Code33Summary`
components — those are edit-focused (inputs, an "as of" picker, a hover-triggered
summary) and belong to a page-owning module other modules shouldn't reach into;
`ExitedFundamentalsModal` is its own small always-visible read-only rendering built
from the same underlying `fundamentals` utils instead.
