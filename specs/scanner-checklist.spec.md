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
- **Only `s` is consumed.** The `d` columns are position-dependent and change with the
  screen's column config, so reading them would couple this script to one saved screen.
  A ticker is all a checklist row needs.
- **Outputs**, both written next to the input file:

  ```ts
  // checklist.json — the current review list, in scanner order
  interface ChecklistItem {
    TICKER: string   // "NSE:ZYDUSLIFE"
    checked: boolean // the review state, owned by the human
  }

  // removed.json — running history of everything dropped out of the checklist
  interface RemovedItem extends ChecklistItem {
    removedAt: string // ISO timestamp of the run that dropped it
  }
  ```

- **Not under `backend/data/`, so not an endpoint.** Dropping these files there would
  make them `/checklist` and `/removed` automatically (see "Adding a resource" in
  [`../CLAUDE.md`](../CLAUDE.md)) — deliberately not done yet, because nothing in the
  frontend consumes them. That's the move if this ever grows a UI.
- **`checked` is the only human-authored value in the system.** Everything else is
  derivable from the scanner export, which is why the sync rules below all exist to
  protect it.

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

| Ticker is…                     | Result                                            |
| ------------------------------ | ------------------------------------------------- |
| in the scan, not the checklist | **added** as `{ TICKER, checked: false }`          |
| in both                        | **left alone** — its `checked` value is preserved  |
| in the checklist, not the scan | **removed**, and appended to `removed.json`        |

- **Removal is a move, never a delete.** A ticker leaving the screen isn't a reason to
  lose that you'd already reviewed it, so it goes to `removed.json` carrying its
  `checked` state and a `removedAt` stamp.
- **`removed.json` accumulates** across runs rather than being overwritten — it's a
  history of what the screen has dropped, not a diff of the last run.
- **A reappearing ticker is restored, not re-added.** If it's in `removed.json` when it
  comes back, it moves back into the checklist **with its old `checked` state** and is
  dropped from the history. Otherwise a stock that briefly fell out of the screen would
  come back looking unreviewed, and get reviewed twice.
- **Re-running the same export is a no-op** — every ticker matches, nothing is written
  that changes meaning. The sync is idempotent, so it's safe to run when unsure.
- **Duplicate tickers within one export are collapsed**, first occurrence winning.
- **A missing `checklist.json` is a first run**, not an error. A malformed one — valid
  JSON that isn't an array — **aborts before writing**, rather than overwriting whatever
  it actually was.

## File map

```
backend/stock-scanner/
├── build-checklist.mjs    # the sync: parse export -> add/restore/remove -> write both files
├── scanner-result.json    # raw TradingView export (input; filename is an argument)
├── checklist.json         # generated — current review list
└── removed.json           # generated — history of dropped tickers
```

Plain `.mjs` run directly by node: no build step, no dependencies, no npm script. It's a
hand-run tool sitting beside its data, and keeping it dependency-free means it works
whatever state the workspace install is in.
