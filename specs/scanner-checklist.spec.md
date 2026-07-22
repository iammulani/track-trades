# Scanner Checklist — Spec

## Purpose

A TradingView scanner run returns a few hundred tickers that pass a screen. Reviewing
them is manual work, done over days, and the screen is re-run periodically — so the
problem is not "list the results", it's **not losing the review work already done** when
the results change.

This is a CLI, not a feature module: no page, no route, no API endpoint. It turns a raw
scanner export into a reviewable checklist and keeps that checklist synced across re-runs.
It lives entirely in `backend/stock-scanner/` and is run by hand from the console.

## Data

- **Source**: `backend/stock-scanner/scanner-result.json` — a raw TradingView scanner
  export, passed by filename as an argument (the filename is an input, not hardcoded).
  Its shape is TradingView's, not ours: `{ totalCount, data: [{ s, d: [...] }] }`, where
  `s` is the ticker (`"NSE:ZYDUSLIFE"`) and `d` is a positional array of screen columns.
- **Captured by hand from the browser**, since TradingView has no export button for this:
  run the screener, open dev tools → Network, filter for `/scan?label-product=screener-stock`,
  and save that response as `scanner-result.json`. The recipe lives in
  `trading-view-list.md` next to the script. **Check `totalCount` against the number of
  rows in `data`** — the screener paginates, so a capture that stops short is silently a
  partial list, and the sync would read every missing ticker as one that dropped off the
  screen.
- **Only `s` is consumed.** The `d` columns are position-dependent and change with the
  screen's column config, so reading them would couple this script to one saved screen.
  A ticker is all a checklist row needs.
- **Outputs are CSV**, both written next to the input file. The review actually happens
  in Google Sheets — upload the CSV, work in the sheet, export it back over the file —
  so the format is chosen to survive that round trip rather than to read well in a
  terminal.

  `checklist.csv` — the current review list, in scanner order:

  ```csv
  ticker,status,comment,date added
  NSE:ZYDUSLIFE,reviewed,"tight base, watching 520",2026-07-22
  NSE:ZENTEC,new,,2026-07-22
  ```

  `removed.csv` — history of everything dropped, newest removal first, with one extra
  column recording when it left:

  ```csv
  ticker,status,comment,date added,date removed
  NSE:AAA,rejected,extended,2026-07-19,2026-07-22
  ```

- **The four columns**, and who owns each:
  - `ticker` — from the scan. The identity of the row; the only column the sync matches on.
  - `status` — **yours**, free text. New rows start as `new`; anything you type is
    preserved verbatim. Deliberately not a fixed enum, so the vocabulary can live in a
    Sheets dropdown and change without touching this code.
  - `comment` — **yours**, free text.
  - `date added` — `YYYY-MM-DD`, stamped once when the ticker first enters the checklist
    and never rewritten, including when a ticker is removed and later restored. It
    answers "how long have I been looking at this", so resetting it on re-entry would
    destroy the only thing it's for.
- **`status` and `comment` are the only human-authored values**, which is why every sync
  rule below exists to protect them.
- **One source of truth.** The CSV is it — there is no parallel JSON or markdown copy.
  Two files both holding `status` would disagree the moment one is edited.
- **Not under `backend/data/`, so not an endpoint.** JSON files dropped there become
  resources automatically (see "Adding a resource" in [`../CLAUDE.md`](../CLAUDE.md)) —
  CSV is not a resource format, so growing a UI later means the checklist moves to
  `backend/data/checklist.json` and this file stops being the source of truth. That's a
  deliberate trade: the CLI is optimised for the Sheets workflow it has now.

## CLI

```bash
node build-checklist.mjs <scanner-result.json> [--dry-run]
```

- **Argument, not config.** The scanner file is named on each run; exports get renamed
  and kept around, and hardcoding one path would mean editing the script to use it.
- **Output paths are derived** from the input file's directory — the checklist belongs
  next to the export it came from.
- **`--dry-run`** prints the full add/restore/remove summary and writes nothing.
  Removals are the destructive half of a sync, so there is a way to look first.
- **Summary on every run**: counts for added / restored / removed / unchanged, each with
  the first few tickers named. A silent sync gives no way to notice the screen changed
  out from under you.

## Behaviour

**The scanner file is the source of truth for membership.** After a run, the checklist
contains exactly the scanned tickers, in scanner order. Three cases:

| Ticker is…                     | Result                                                    |
| ------------------------------ | --------------------------------------------------------- |
| in the scan, not the checklist | **added** with `status: new` and today as `date added`    |
| in both                        | **left alone** — all three of your columns preserved      |
| in the checklist, not the scan | **removed**, and moved into `removed.csv`                 |

- **Removal is a move, never a delete.** A ticker leaving the screen isn't a reason to
  lose that you'd already reviewed it, so it goes to `removed.csv` carrying its `status`,
  `comment`, and original `date added`.
- **`removed.csv` accumulates** across runs rather than being overwritten — it's a
  history of what the screen has dropped, not a diff of the last run.
- **A reappearing ticker is restored, not re-added.** If it's in `removed.csv` when it
  comes back, it moves back into the checklist **with its status, comment, and original
  `date added`**, and is dropped from the history. Otherwise a stock that briefly fell
  out of the screen would come back looking untouched, and get reviewed twice.
- **Re-running the same export is a no-op** — every ticker matches, nothing is written
  that changes meaning. The sync is idempotent, so it's safe to run when unsure.
- **Duplicate tickers are collapsed, first occurrence winning** — in the export, in
  `checklist.csv`, and in `removed.csv`. A repeated row is much more likely to be a
  stray edit than a correction, and the first copy is the one carrying the comment;
  `removed.csv` is written newest-first, so first-wins also means the most recent
  removal is the one that counts.
- **A missing `checklist.csv` is a first run**, not an error.
- **Rows are read positionally, not by header name**, and a row with no ticker in the
  first field is skipped. Sheets exports vary in how they quote and order things; being
  lenient on read means a round trip through a spreadsheet can't corrupt the file.
- **Extra columns you add in Sheets are dropped on the next sync.** The four columns are
  the contract. Anything beyond them is not read, so it cannot be written back.

### CSV handling

- **Written RFC 4180**: fields containing a comma, quote, or newline are wrapped in
  double quotes, and embedded quotes are doubled. A comment like `tight base, watch 520`
  must survive being written and read back, so this is not optional.
- **Read with a real parser**, not `split(',')` — quoted fields may contain commas and
  newlines, and a naive split silently shreds every comment you write in Sheets.
- **Header row is written, and skipped on read** if the first field is literally
  `ticker`. Sheets needs the header to label the columns.

## File map

```
backend/stock-scanner/
├── build-checklist.mjs    # the sync: parse export -> add/restore/remove -> write both files
├── trading-view-list.md   # how to capture the export from TradingView's dev-tools network tab
├── scanner-result.json    # raw TradingView export (input; filename is an argument)
├── checklist.csv          # generated — current review list, the Sheets working copy
└── removed.csv            # generated — history of dropped tickers, newest first
```

Plain `.mjs` run directly by node: no build step, no dependencies, no npm script — the
CSV reader and writer are ~20 lines each and hand-rolled for that reason. It's a
hand-run tool sitting beside its data, and keeping it dependency-free means it works
whatever state the workspace install is in.
