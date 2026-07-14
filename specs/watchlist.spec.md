# Watchlist — Spec

## Purpose

Track symbols the trader is keeping an eye on but hasn't traded yet — added by
typing a ticker, tagged with the **long/short bias** and _why_ it's being
watched, with an optional note on the setup, movable between reasons as the
setup evolves, searchable, and showing how long it's been on the list.

## Data

- **Source:** `GET /api/watchlist` → the `watchlist` resource in
  `backend/data/watchlist.json`.
- **Raw shape** (`types/watchlistItem.ts`):

  | field          | type                                 | meaning                                 |
  | -------------- | ------------------------------------ | --------------------------------------- |
  | `id`           | string                               | unique id                               |
  | `symbol`       | string                               | ticker, stored upper-case               |
  | `category`     | `"active" \| "daily" \| "long-term"` | why it's being watched                  |
  | `side`         | `"long" \| "short"`                  | the bias being watched for              |
  | `watchedSince` | string (ISO)                         | when it was added to the list           |
  | `notes`        | string?                              | free text — the setup, what to wait for |
  | `link`         | string?                              | URL — a chart, news article, or writeup |

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

1. **Header** (`shared/PageHeader`) — icon chip + title "Watchlist" + one-line
   subtitle. No actions here — the Add button lives in the toolbar, not the header.
2. **Toolbar** — one row: a ticker **search box** (`TickerSearch`, left), the
   **filter tabs** (`CategoryFilterTabs`, middle) — `All` plus the three
   categories, each with a live count and a colour dot — and the **Add**
   button (`margin-left: auto`, so it's right-aligned to the table's right
   edge, on the same line as the filters rather than up in the header). The
   active category filter is reflected in the URL as `?category=<value>` (or
   no param for "All"), so a filtered view is a shareable/bookmarkable link.
   Search is client-side only (not in the URL) and applies **within** the
   active category filter. There is no inline add form on the page — Add
   only opens the popup.
3. **Table** (`WatchlistTable`) — one row per item (respecting filter + search),
   newest-watched first. Columns: `Stock` (avatar chip, reusing the shared
   per-symbol colour, plus a small link icon next to the symbol when `link`
   is set — opens the URL in a new tab), `Side` (`shared/SideBadge` — long/short pill, the same
   one the dashboard's trades table uses), `Watching for` (the humanised
   duration), `Since` (datetime), `Reason` (`CategorySelect` — an inline
   dropdown, not a static badge: picking a different value **moves the item
   to that category** immediately), `Notes`, a **Place Trade** action (pill
   button, links to `/watchlist/:id/place-trade` — see
   [place-trade.spec.md](place-trade.spec.md)), and a remove (×) action.
   A row whose place-trade run was parked as a **draft** (see
   [drafts.spec.md](drafts.spec.md)) shows a **Draft** pill next to the symbol
   (its `title` = when it was last saved), and its action pill reads **Resume
   Draft** instead of Place Trade (same link — the stepper hydrates itself back
   to the step it was left on). The row gains **no** second action: discarding a
   draft is only offered from inside the stepper, where you can see what you're
   about to throw away — see [place-trade.spec.md](place-trade.spec.md).
4. **Add popup** (`AddTickerModal`, shared `Modal`) — ticker input (autofocused,
   auto-uppercased), a required **long/short toggle** (defaults to "Long"),
   a required category picker (segmented pills, defaults to whatever filter
   tab was active when opened, else "Watch Daily"), a required **"Watching
   since" date** (defaults to today, can be backdated but not set in the
   future — lets a symbol that was actually being watched earlier be added
   with its real start date instead of today's), an **optional note**
   (textarea — the setup, what to wait for), and an **optional link** (URL
   input — a chart, news article, or writeup for the setup). If the typed ticker already
   exists on the list, an inline warning names its current category and
   **the Add button is disabled** — there's no reason to duplicate a row;
   the user should move the existing one via `CategorySelect` instead.
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
  confirming calls `DELETE /watchlist/:id`. It **also discards that item's draft**,
  if it has one — a draft with no watchlist item behind it can never be resumed.
  This is the only place the Watchlist deletes a draft; discarding one on its own
  belongs to the stepper.
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
├── types/watchlistItem.ts      # WatchlistItem, WatchCategory, WatchSide, derived types
├── api/watchlistApi.ts         # fetchWatchlist, addWatchlistItem, removeWatchlistItem, updateWatchlistCategory
├── hooks/useWatchlist.ts       # fetch + derive + add/remove/updateCategory actions (silent refetch)
├── utils/
│   ├── categories.ts           # CATEGORIES (fixed order + tone), categoryMeta()
│   └── watchlistMetrics.ts     # withWatchMetrics, formatWatchedLabel, sortByWatchedDesc
└── components/
    ├── AddTickerModal.tsx      # popup: ticker + side + category + note, duplicate-ticker warning/block
    ├── TickerSearch.tsx        # client-side ticker search box
    ├── CategoryFilterTabs.tsx  # All/Active/Daily/Long-term, with counts
    ├── CategorySelect.tsx      # inline dropdown pill — reassigns an item's category
    └── WatchlistTable.tsx      # the detail table; owns the remove-confirmation flow

frontend/src/shared/components/
├── PageHeader.tsx               # icon chip + title + subtitle, used by every page
├── SideBadge.tsx                # long/short pill — shared with the dashboard's trades table
├── Modal.tsx                    # backdrop + card shell (Escape/backdrop-click to close)
└── ConfirmDialog.tsx            # confirm/cancel modal built on Modal; message accepts rich content
```

Uses `shared/utils/avatarColor.ts` (also used by the dashboard's trades table)
for the per-symbol avatar chip — the one place that mapping lives. Also uses
`shared/utils/dateInput.ts` (`todayDateValue`, `dateValueToIso`) for the "Watching
since" date field — the same helper `modules/place-trade` uses for its entry
date (see [place-trade.spec.md](place-trade.spec.md)).

The barrel (`index.ts`) also exports `useWatchlist` and the item types —
`modules/place-trade` consumes both to load the item being traded and remove
it once the trade is placed.
