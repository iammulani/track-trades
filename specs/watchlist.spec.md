# Watchlist — Spec

## Purpose

Track symbols the trader is keeping an eye on but hasn't traded yet — added by
typing a ticker, tagged with _why_ it's being watched, movable between reasons
as the setup evolves, searchable, and showing how long it's been on the list.

## Data

- **Source:** `GET /api/watchlist` → the `watchlist` resource in
  `backend/data/watchlist.json`.
- **Raw shape** (`types/watchlistItem.ts`):

  | field          | type                                 | meaning                       |
  | -------------- | ------------------------------------ | ----------------------------- |
  | `id`           | string                               | unique id                     |
  | `symbol`       | string                               | ticker, stored upper-case     |
  | `category`     | `"active" \| "daily" \| "long-term"` | why it's being watched        |
  | `watchedSince` | string (ISO)                         | when it was added to the list |
  | `notes`        | string?                              | free text                     |

- **Categories** (`utils/categories.ts` — fixed order, never reordered by data):
  1. `active` — **Actively Watching**: near the trading area, could trigger soon.
  2. `daily` — **Watch Daily**: check in daily, may set up for a trade.
  3. `long-term` — **Long-Term Setup**: looks good, wants a better entry.

- **Derived — per item** (`utils/watchlistMetrics.ts`):
  - `watchedMs` = `now − watchedSince`.
  - `watchedLabel` = humanised: `Today` / `1 day` / `N days` (< 30d) / `N months`
    (< 12mo) / `N years`.

## UI

Reached via the **Watchlist** sidebar item. Top to bottom:

1. **Header** — title "Watchlist" + one-line subtitle, with an **Add** button
   (top-right) that opens the add popup. There is no inline add form on the page.
2. **Toolbar** — a ticker **search box** (`TickerSearch`, left) plus the
   **filter tabs** (`CategoryFilterTabs`, right): `All` plus the three
   categories, each with a live count and a colour dot. The active filter is
   reflected in the URL as `?category=<value>` (or no param for "All"), so a
   filtered view is a shareable/bookmarkable link. Search is client-side only
   (not in the URL) and applies **within** the active category filter.
3. **Table** (`WatchlistTable`) — one row per item (respecting filter + search),
   newest-watched first. Columns: `Stock` (avatar chip, reusing the shared
   per-symbol colour), `Watching for` (the humanised duration), `Since`
   (datetime), `Reason` (`CategorySelect` — an inline dropdown, not a static
   badge: picking a different value **moves the item to that category**
   immediately), `Notes`, and a remove (×) action.
4. **Add popup** (`AddTickerModal`, shared `Modal`) — ticker input (autofocused,
   auto-uppercased) + required category picker (segmented pills, defaults to
   whatever filter tab was active when opened, else "Watch Daily"). If the
   typed ticker already exists on the list, an inline warning names its current
   category and **the Add button is disabled** — there's no reason to duplicate
   a row; the user should move the existing one via `CategorySelect` instead.
5. **Remove confirmation** (`ConfirmDialog`, shared `Modal`) — shows the
   symbol prominently (avatar chip + bold ticker, not buried in a sentence) so
   it's unambiguous which stock is about to be removed.

## Behaviour

- Sorted by `watchedSince` descending (most recently added first).
- **Colour = category**, fixed mapping: `active` → amber, `daily` → accent
  (indigo), `long-term` → violet — always paired with the category label, never
  colour alone.
- **After adding, the view always resets to the "All" filter** and the popup
  closes. This is deliberate: an item added while looking at, say, "Actively
  Watching" won't appear there if its category differs, and without this reset
  the add would look like it silently failed.
- **Duplicate tickers are blocked at add time**, not just warned after the
  fact — case-insensitive match against existing symbols.
- **Moving categories** calls `PATCH /watchlist/:id` with the new `category`
  and refetches.
- **Removing requires confirmation** — clicking × opens `ConfirmDialog`; only
  confirming calls `DELETE /watchlist/:id`.
- Refetches after add/remove/move are silent (no loading flash) — only the
  first load shows the loading state.
- **States:** loading → "Loading…"; error → message; empty list → prompt to add
  a ticker; empty filtered/search result → distinct messages ("No symbols in
  this category yet." vs `No tickers match "<query>".`).

## Module map

```
frontend/src/modules/watchlist/
├── WatchlistPage.tsx           # composes header/toolbar/table; owns URL filter + search + modal-open state
├── WatchlistPage.css
├── index.ts                    # exports WatchlistPage
├── types/watchlistItem.ts      # WatchlistItem, WatchCategory, derived types
├── api/watchlistApi.ts         # fetchWatchlist, addWatchlistItem, removeWatchlistItem, updateWatchlistCategory
├── hooks/useWatchlist.ts       # fetch + derive + add/remove/updateCategory actions (silent refetch)
├── utils/
│   ├── categories.ts           # CATEGORIES (fixed order + tone), categoryMeta()
│   └── watchlistMetrics.ts     # withWatchMetrics, formatWatchedLabel, sortByWatchedDesc
└── components/
    ├── AddTickerModal.tsx      # popup: ticker + category picker, duplicate-ticker warning/block
    ├── TickerSearch.tsx        # client-side ticker search box
    ├── CategoryFilterTabs.tsx  # All/Active/Daily/Long-term, with counts
    ├── CategorySelect.tsx      # inline dropdown pill — reassigns an item's category
    └── WatchlistTable.tsx      # the detail table; owns the remove-confirmation flow

frontend/src/shared/components/
├── Modal.tsx                   # backdrop + card shell (Escape/backdrop-click to close)
└── ConfirmDialog.tsx           # confirm/cancel modal built on Modal; message accepts rich content
```

Uses `shared/utils/avatarColor.ts` (also used by the dashboard's trades table)
for the per-symbol avatar chip — the one place that mapping lives.
