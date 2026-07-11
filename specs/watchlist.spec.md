# Watchlist — Spec

## Purpose

Track symbols the trader is keeping an eye on but hasn't traded yet — added by
typing a ticker, tagged with _why_ it's being watched, and showing how long
it's been on the list.

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

1. **Header** — title "Watchlist" + one-line subtitle.
2. **Add form** (`AddTickerForm`) — a ticker text input (auto-uppercased) plus a
   required category picker (segmented pill buttons, one of the three above,
   defaults to "Watch Daily"), and an Add button. Submitting posts the item with
   `watchedSince` set to _now_ and clears the input.
3. **Filter tabs** (`CategoryFilterTabs`) — `All` plus the three categories, each
   with a live count and a colour dot matching its category. The active filter
   is reflected in the URL as `?category=<value>` (or no param for "All"), so a
   filtered view is a shareable/bookmarkable link.
4. **Table** (`WatchlistTable`) — one row per item (respecting the active
   filter), newest-watched first. Columns: `Stock` (avatar chip, reusing the
   shared per-symbol colour), `Watching for` (the humanised duration), `Since`
   (datetime), `Reason` (`CategoryBadge`), `Notes`, and a remove (×) action.

## Behaviour

- Sorted by `watchedSince` descending (most recently added first).
- **Colour = category**, fixed mapping: `active` → amber, `daily` → accent
  (indigo), `long-term` → violet — always paired with the category label, never
  colour alone.
- Removing an item calls `DELETE /watchlist/:id` and refetches.
- **States:** loading → "Loading…"; error → message; empty list → prompt to add
  a ticker; empty _filtered_ result → "No symbols in this category yet."

## Module map

```
frontend/src/modules/watchlist/
├── WatchlistPage.tsx           # composes form + filters + table; owns URL filter state
├── WatchlistPage.css
├── index.ts                    # exports WatchlistPage
├── types/watchlistItem.ts      # WatchlistItem, WatchCategory, derived types
├── api/watchlistApi.ts         # fetchWatchlist, addWatchlistItem, removeWatchlistItem
├── hooks/useWatchlist.ts       # fetch + derive + add/remove actions
├── utils/
│   ├── categories.ts           # CATEGORIES (fixed order + tone), categoryMeta()
│   └── watchlistMetrics.ts     # withWatchMetrics, formatWatchedLabel, sortByWatchedDesc
└── components/
    ├── AddTickerForm.tsx       # ticker input + category picker + submit
    ├── CategoryFilterTabs.tsx  # All/Active/Daily/Long-term, with counts
    ├── CategoryBadge.tsx       # category pill
    └── WatchlistTable.tsx      # the detail table
```

Uses `shared/utils/avatarColor.ts` (also used by the dashboard's trades table)
for the per-symbol avatar chip — the one place that mapping lives.
