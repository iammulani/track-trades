# Watchlist — Spec

## Purpose

Track symbols the trader is keeping an eye on but hasn't traded yet — added by
typing a ticker, tagged with the **long/short bias** and _why_ it's being
watched, carrying **a dated log of notes** on how the setup is developing,
movable between reasons as the setup evolves, **rateable out of 5 stars so the
best setups can be set aside**, searchable, and showing how long it's been on
the list.

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
  | `notes`        | `WatchNote[]`?                       | dated journal entries on the setup      |
  | `link`         | string?                              | URL — a chart, news article, or writeup |
  | `rating`       | `0 \| 1 \| 2 \| 3 \| 4 \| 5`?        | manual star rating; `0`/absent = unrated |

  A **`WatchNote`**:

  | field        | type          | meaning                                                  |
  | ------------ | ------------- | -------------------------------------------------------- |
  | `id`         | string        | unique id (`crypto.randomUUID()`)                         |
  | `text`       | string        | **what happened** — the event, price action, the numbers  |
  | `conclusion` | string?       | **what you read into it** — optional; absent, never `''`  |
  | `date`       | string (ISO)  | the day the observation belongs to — backdatable          |
  | `editedAt`   | string (ISO)? | set only once an entry is changed; absent = never edited  |

- **Categories** (`utils/categories.ts` — fixed order, never reordered by data):
  1. `active` — **Actively Watching**: near the trading area, could trigger soon.
  2. `daily` — **Watch Daily**: check in daily, may set up for a trade.
  3. `long-term` — **Long-Term Setup**: looks good, wants a better entry.

- **Rating** (`utils/ratings.ts`) — a **manual** 1–5 star judgement of how good
  the setup is, entirely separate from the computed checklist score
  `modules/place-trade` produces (see [place-trade.spec.md](place-trade.spec.md)).
  It is **optional**: items are always created unrated (the Add popup has no
  rating field), rated later on the list, and can be re-rated or cleared at any
  time. `itemRating()` is the one place "absent means unrated" is decided, so
  the 0-vs-undefined distinction never leaks into components.

- **Notes** (`utils/notes.ts`) — a **dated log**, not one field. A symbol you've
  watched for three months accumulates observations; overwriting yesterday's read
  with today's throws away exactly the record worth keeping. So each note carries
  its own `date`, entries are shown newest first, and **every entry stays editable
  and deletable however old it is**.

  Each entry is split into **what happened** (`text`) and **what you read into it**
  (`conclusion`, optional). This split is the point of the log, not decoration: the
  fact is fixed and the judgement is yours, and months later — reviewing why a setup
  worked or didn't — you need to tell them apart. "PAT −5%, stock −12.7%" is a
  record; "base is broken, not tightening" is a call you made, and it can be wrong.
  Keeping the call out of the fact means re-reading the log doesn't relitigate the
  facts through the lens of what you concluded at the time. An empty conclusion is
  stored as **absent, never `''`**, so "has a conclusion" is a plain truthiness
  check and clearing one in the editor genuinely removes it.

  Editing is allowed on any entry however old — a note is a record you can correct,
  and the `editedAt` stamp keeps that honest rather than silent. `itemNotes()` is the one
  place "absent means no notes" is decided, and it also reads the **legacy single
  string** shape (pre-log rows) back as one entry dated `watchedSince`, so the
  0-vs-`''`-vs-`[]` distinction never leaks into components. No data migration was
  needed: a row converts to an array the first time a note is saved against it.

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
   edge, on the same line as the filters rather than up in the header). A
   **second row** below holds the **rating filter** (`RatingFilterTabs`) —
   `Any rating`, `★1`…`★5` (exact rating, not a threshold), and `Unrated`,
   each with a live count. It gets its own row deliberately: eleven pills on
   one line stops being scannable.
   Both filters are reflected in the URL — `?category=<value>` and
   `?rating=<1-5|unrated>`, each omitted at its default — so a filtered view is
   a shareable/bookmarkable link. **The two params compose**: changing one
   never clears the other. Search is client-side only (not in the URL) and
   applies **within** the active category + rating filters, in that order.
   There is no inline add form on the page — Add only opens the popup.
3. **Table** (`WatchlistTable`) — one row per item (respecting filter + search),
   newest-watched first. Columns: `Stock` (no header label — the avatar chip
   and symbol are self-evidently the row's identity, left-aligned rather than
   centred like the rest of the table so varying-length tickers don't zigzag;
   avatar reuses the shared per-symbol colour, plus a small link icon next to
   the symbol when `link` is set — opens the URL in a new tab), `Side`
   (`shared/SideBadge` — long/short pill, the same
   one the dashboard's trades table uses), `Since` (the humanised duration bold on top — `12 days` — with
   the date underneath in muted small text — `Jul 24`; the full timestamp is
   the cell's hover title, since the time of day is noise next to the
   duration and the table is already wide. One column, not two — the
   duration and the date are the same fact at two grains, so they don't
   need separate headers), `Rating` (`RatingStar` — a single star icon with the
   number beside it, not a five-star row and not a digit overlaid on the
   icon (both tried first: five stars were the widest thing in the table,
   and text cramped inside an icon's uneven silhouette read poorly at this
   size). Outline and muted while unrated; once rated, each
   value 1–5 gets its own fixed colour from `RATING_TONES` (`utils/ratings.ts`)
   — a cold-to-hot ramp, blue → teal → amber → orange → red — so the exact
   value is readable from colour alone at a glance, with the number there
   too for anyone still learning the scale. One click steps it forward —
   unrated → 1 → 2 → 3 → 4 → 5 → back to unrated. Trades "click star N to
   jump straight to N" for a fraction of the width; the full 1-5 star
   *display* (read-only) still exists elsewhere — `shared/components/RatingStars`,
   used for the computed Code 33 read, is untouched by this), `Reason` (`CategorySelect` — an icon-only chip
   naming the category by icon + colour, not spelled-out text: `target` for
   Actively Watching, `clock` for Watch Daily, `trending` for Long-Term
   Setup, with the full name as the chip's hover title. It's a real native
   `<select>` underneath (invisible but full-size and focusable, so click,
   keyboard and screen-reader access all still work) — opening it shows the
   full category names same as before; picking a different value **moves the
   item to that category** immediately. Not a static badge), `Notes` (a
   single **icon button**, not a text
   cell — muted when the log is empty, accent-tinted once it has entries, with a
   small count badge when there's more than one; it opens the notes popup. The
   bodies live in the popup so the column stays narrow: free text at full width
   cost ~320px for content that's usually empty and made rows different heights),
   `Fundamentals` (`Code33Badge` — a single icon, no stars or score in this
   compact spot: muted until at least one quarter has been captured, accent
   once it has, `title` naming the verdict once there's one to name (or just
   "Verify fundamentals" before any data exists). The colour says whether
   fundamentals have been captured, not what they read — the actual star
   rating and verdict live on the page this always links through to:
   `/watchlist/:id/verify-fundamental` — see
   [verify-fundamental.spec.md](verify-fundamental.spec.md); this badge is
   the row's **only** entry point to that page — there's no separate Verify
   Fundamental action in the actions cell, since that would just be a second
   link to the same destination sitting next to the badge), a **Place
   Trade** action (pill
   button, links to `/watchlist/:id/place-trade` — see
   [place-trade.spec.md](place-trade.spec.md)), and a remove (×) action.
   A row whose place-trade run was parked as a **draft** (see
   [drafts.spec.md](drafts.spec.md)) shows a **Draft** pill next to the symbol
   (its `title` = when it was last saved), and its action pill reads **Resume
   Draft** instead of Place Trade (same link — the stepper hydrates itself back
   to the step it was left on). The row gains **no** second action: discarding a
   draft is only offered from inside the stepper, where you can see what you're
   about to throw away — see [place-trade.spec.md](place-trade.spec.md). Unlike
   Place Trade, Verify Fundamental never removes the row or offers a discard —
   it's a non-destructive, repeat-visit action (see
   [fundamentals.spec.md](fundamentals.spec.md)).
4. **Add popup** (`AddTickerModal`, shared `Modal`) — ticker input (autofocused,
   auto-uppercased), a required **long/short toggle** (defaults to "Long"),
   a required category picker (segmented pills, defaults to whatever filter
   tab was active when opened, else "Watch Daily"), a required **"Watching
   since" date** (defaults to today, can be backdated but not set in the
   future — lets a symbol that was actually being watched earlier be added
   with its real start date instead of today's), an **optional opening note**
   (a single textarea — the setup, what to wait for; it becomes the first entry
   in the item's log, dated `watchedSince` rather than "now", since a backdated
   ticker's first thought belongs on the day it was actually had. No conclusion
   field here: at the moment of adding there's nothing yet to conclude from), and an
   **optional link** (URL
   input — a chart, news article, or writeup for the setup). If the typed ticker already
   exists on the list, an inline warning names its current category and
   **the Add button is disabled** — there's no reason to duplicate a row;
   the user should move the existing one via `CategorySelect` instead.
5. **Notes popup** (`NotesModal`, shared `Modal`) — the dated log for one symbol,
   opened from the Notes icon. Header: avatar chip + ticker + entry count, so
   it's unambiguous whose notes these are, plus a small **"+ Add note"** pill.

   The popup **opens in view mode**: the log starts directly under the header and
   gets the height. The composer is a panel the Add pill unfolds, not a permanent
   fixture — left always-open it ate ~200px of a ~480px popup for a form you use
   far less often than you read. Unfolding it focuses the first field, hides the
   Add pill, and offers **Cancel** alongside "Add note"; adding or cancelling
   folds it away and discards the draft, so what you land back on is the log with
   your new entry at the top. An **empty log opens unfolded** — there's nothing to
   read, so the one useful action shouldn't cost a click — and drops the Cancel,
   since there'd be nothing to go back to.

   The composer itself is two stacked textareas, "what happened" (required) above
   "your read on it" (optional, set visually subordinate so the split reads before
   you type), plus a **date** field defaulting to today and capped at today
   (backdatable, so a thought you had last week gets logged on the day you had
   it), and an "Add note" button disabled until there's a fact.

   Entries run **newest first**. Each reads
   as one sentence — **`Jul 22 —` in bold opening the fact inline**, not as a
   separate heading line, because that's how you'd say it out loud — with the
   conclusion below it as an indented **quote block** (left rule, muted, smaller)
   when there is one, and an `edited <date>` marker underneath when it has one.
   Line breaks are preserved in both. On row hover a **pencil** and a **×** fade
   in, pinned top-right so their appearing never reflows the text. Pencil swaps
   the entry into the same two-field editor with Save/Cancel; the date is shown
   but not editable there, and saving only stamps `editedAt` if something
   actually changed. Emptying the conclusion field removes it. × flips the entry into an
   inline "Delete this note?" confirmation rather than opening a `ConfirmDialog`:
   stacking a second `Modal` backdrop over this one looks broken, and the entry
   being deleted is already on screen to read. An empty log needs no empty-state
   copy while the composer is unfolded — the placeholder text already says what
   goes there; "No notes yet." only shows if you fold the composer away.
6. **Exit confirmation** (`ExitWatchlistModal`, shared `Modal`) — shows the
   symbol prominently (avatar chip + bold ticker, not buried in a sentence) so
   it's unambiguous which stock is about to be removed, a **required** reason
   `<select>` (options from `modules/exited-watchlist`'s `EXIT_REASONS` — Fundamentals
   Poor, Peer Comparison Failed, VCP / Base Failed, and others; see
   [exited-watchlist.spec.md](exited-watchlist.spec.md)), and an **optional** note
   textarea. Submit is disabled until a reason is picked. This replaced a plain
   `ConfirmDialog` once removing stopped being destructive — the row now moves to
   the Exited Watchlist instead of being deleted, so what used to be "are you sure"
   is now "why".

## Behaviour

- **Sorted by rating descending, then `watchedSince` descending** — the
  best-rated setups float to the top and unrated ones sink to the bottom, with
  newest-added first inside each rating. Re-rating an item visibly moves it,
  which is the point: the shortlist maintains itself without needing a filter.
- **Colour = category**, fixed mapping: `active` → amber, `daily` → accent
  (indigo), `long-term` → violet — always paired with a shape that also
  distinguishes the category, never colour alone: the label text in the
  filter tabs and Add popup, a distinct icon in the table's compact Reason
  chip.
- **After adding, the view always resets to "All" + "Any rating"** and the popup
  closes. This is deliberate: an item added while looking at, say, "Actively
  Watching" won't appear there if its category differs — and a new item is
  always unrated, so it would vanish under any star filter. Without this reset
  the add would look like it silently failed.
- **Duplicate tickers are blocked at add time**, not just warned after the
  fact — case-insensitive match against existing symbols.
- **Moving categories** calls `PATCH /watchlist/:id` with the new `category`
  and refetches.
- **Rating** calls `PATCH /watchlist/:id` with the new `rating` and refetches —
  the same silent-refetch path, so the row re-sorts into place without a flash.
  Clearing a rating PATCHes `0` rather than deleting the key, so the stored
  value is always a plain number.
- **Adding, editing and deleting a note** all go down one path: the popup computes
  the next list and `PATCH`es the **whole `notes` array** to `/watchlist/:id`, then
  the same silent refetch runs. One API call covers all three because the array is
  small and this is a single-user local-first journal — there's no concurrent writer
  to lose an entry to.
- **Removing requires a reason** — clicking × opens `ExitWatchlistModal`; only
  confirming (with a reason picked) archives the item. The full item — including its
  fundamentals record's raw quarters, if `useFundamentals().byWatchlistItemId` has one
  for it — is first `POST`ed to `/exited-watchlist` (see
  [exited-watchlist.spec.md](exited-watchlist.spec.md)) along with the reason, optional
  note, and an `exitedAt` timestamp — **only once that succeeds** does
  `DELETE /watchlist/:id` run, so a failed archive never loses the row. It **also
  discards that item's draft**, if it has one — a draft with no watchlist item behind
  it can never be resumed, and unlike fundamentals a draft has nothing worth carrying
  into a read-only archive (it's mid-entry stepper state, not captured research), so it
  really is just deleted. This is the only place the Watchlist deletes a draft;
  discarding one on its own belongs to the stepper. It **also deletes that item's live
  fundamentals record**, the same way — but only *after* its quarters have already been
  copied into the archived item, so the data survives the delete; see
  [fundamentals.spec.md](fundamentals.spec.md) and
  [exited-watchlist.spec.md](exited-watchlist.spec.md).
- Refetches after add/remove/move/rate/note are silent (no loading flash) — only
  the first load shows the loading state. The open notes popup re-reads its item
  from the refreshed list by id, so a save flows straight back into it instead of
  leaving it on a stale copy.
- **States:** loading → "Loading…"; error → message; empty list → prompt to add
  a ticker; empty filtered/search result → distinct messages ("No symbols in
  this category yet." / "No symbols with this rating yet." / "Everything on
  your watchlist is rated." vs `No tickers match "<query>".`).

## Module map

```
frontend/src/modules/watchlist/
├── WatchlistPage.tsx           # composes header/toolbar/table; owns URL filter + search + modal-open state
├── WatchlistPage.css
├── index.ts                    # exports WatchlistPage
├── types/watchlistItem.ts      # WatchlistItem, WatchCategory, WatchSide, derived types
├── api/watchlistApi.ts         # fetchWatchlist, addWatchlistItem, removeWatchlistItem, updateWatchlistCategory, updateWatchlistRating, updateWatchlistNotes
├── hooks/useWatchlist.ts       # fetch + derive + add/remove/updateCategory/updateRating/updateNotes actions (silent refetch)
├── utils/
│   ├── categories.ts           # CATEGORIES (fixed order + tone), categoryMeta()
│   ├── ratings.ts              # RATING_VALUES, itemRating() (absent = unrated), cycleRating() (unrated→1..5→unrated), RATING_TONES (fixed cold→hot colour per value)
│   ├── notes.ts                # itemNotes() (absent/legacy string = none), noteCount(), makeNote() (drops an empty conclusion), sortNotesByDate()
│   └── watchlistMetrics.ts     # withWatchMetrics, formatWatchedLabel, sortByRatingThenWatched
└── components/
    ├── AddTickerModal.tsx      # popup: ticker + side + category + opening note, duplicate-ticker warning/block
    ├── NotesModal.tsx          # popup: the dated notes log — fact + optional conclusion per entry
    ├── ExitWatchlistModal.tsx  # popup: required exit reason + optional note, replaces the old remove confirm
    ├── CategoryFilterTabs.tsx  # All/Active/Daily/Long-term, with counts
    ├── RatingFilterTabs.tsx    # Any/★1-★5/Unrated, with counts — reuses CategoryFilterTabs.css pills
    ├── CategorySelect.tsx      # icon-only chip over a real <select> — reassigns an item's category
    ├── RatingStar.tsx          # compact rating control — star icon + number, click cycles unrated→1..5→unrated
    └── WatchlistTable.tsx      # the detail table; owns the exit-and-archive flow

frontend/src/shared/components/
├── PageHeader.tsx               # icon chip + title + subtitle, used by every page
├── SideBadge.tsx                # long/short pill — shared with the dashboard's trades table
├── TickerSearch.tsx              # client-side ticker search box — promoted here once modules/exited-watchlist needed it too
├── Modal.tsx                    # backdrop + card shell (Escape/backdrop-click to close)
└── ConfirmDialog.tsx            # confirm/cancel modal built on Modal; message accepts rich content
```

Uses `shared/utils/avatarColor.ts` (also used by the dashboard's trades table)
for the per-symbol avatar chip — the one place that mapping lives, shared by the
table, the remove confirmation and the notes popup. Also uses
`shared/utils/dateInput.ts` (`todayDateValue`, `dateValueToIso`) for both the
"Watching since" date field and the notes composer's date — the same helper
`modules/place-trade` uses for its entry date (see
[place-trade.spec.md](place-trade.spec.md)).

`NotesModal` follows `modules/dashboard`'s `ExitTradeModal` pattern of being
**open when its target object is non-null** rather than taking a separate `open`
flag — the thing being edited and the open state are the same fact.

`RatingStar` (singular) is unrelated to `shared/components/RatingStars`
(plural) despite the name — that one is a read-only, ratio-clipped rendering
of a *computed* score (trade rating, Code 33) as a row of stars; this is an
interactive control for a *manual* judgement, rendered as a single icon
rather than a row of five, since a five-star row was exactly what made the
column wide in the first place.

The barrel (`index.ts`) also exports `useWatchlist` and the item types —
`modules/place-trade` consumes both to load the item being traded and remove
it once the trade is placed.

Depends on `modules/fundamentals` (`useFundamentals`, `Code33Badge`) the same
way it depends on `modules/drafts` — both are domain-only leaves that neither
imports back, so there's no cycle. See
[fundamentals.spec.md](fundamentals.spec.md) and
[verify-fundamental.spec.md](verify-fundamental.spec.md).

Also depends on `modules/exited-watchlist` for `EXIT_REASONS`/`ExitReason`
(used by `ExitWatchlistModal`) and `addExitedWatchlistItem` (called from
`WatchlistPage` when a row is exited) — one-way, `exited-watchlist` never
imports back. The barrel here also exports `itemRating`, `itemNotes`,
`categoryMeta`, `CATEGORIES`, and `formatWatchedLabel` specifically so
`exited-watchlist` can reuse them rather than reimplementing. See
[exited-watchlist.spec.md](exited-watchlist.spec.md).
