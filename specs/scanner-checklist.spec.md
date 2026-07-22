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
- **Outputs are markdown, not JSON**, both written next to the input file. This file is
  read and ticked by a human far more often than it's parsed, so it's optimised for
  that: JSON cost 4 lines per stock (~12 visible per screen), markdown costs 1 (~45).
  It also renders as real clickable checkboxes in VS Code's markdown preview, and a
  review shows up in git as `- [ ] → - [x]` rather than a reshuffled JSON block.

  `checklist.md` — the current review list, in scanner order:

  ```markdown
  # Scanner Checklist

  _124 stocks · 38 reviewed · synced 2026-07-22 from scanner-result.json_

  - [x] NSE:ZYDUSLIFE
  - [ ] NSE:ZENTEC  strong base, watch for volume
  ```

  `removed.md` — history of everything dropped, newest run first, grouped under a
  `## YYYY-MM-DD` heading per run. The heading **is** the removal date; it isn't
  repeated on each line:

  ```markdown
  # Removed from the checklist

  ## 2026-07-22
  - [x] NSE:AAA  already reviewed, screen dropped it
  - [ ] NSE:CCC
  ```

- **Anything after the ticker on a line is a free-text note, preserved verbatim**
  across syncs — including when a stock is removed and when it comes back. Reviewing a
  list means writing on it, and a sync that erased your annotations would make the file
  worse than the JSON it replaced.
- **Everything outside the `- [ ]` lines is regenerated**, so the title and the summary
  line are not places to keep notes.
- **Not under `backend/data/`, so not an endpoint.** JSON files dropped there become
  resources automatically (see "Adding a resource" in [`../CLAUDE.md`](../CLAUDE.md)) —
  markdown is not a resource format, so growing a UI later means the checklist moves to
  `backend/data/checklist.json` and this file stops being the source of truth. That's a
  deliberate trade: the CLI is optimised for the hand-editing workflow it has now.
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

| Ticker is…                     | Result                                              |
| ------------------------------ | --------------------------------------------------- |
| in the scan, not the checklist | **added** as an unticked `- [ ]` line               |
| in both                        | **left alone** — tick state and note both preserved |
| in the checklist, not the scan | **removed**, and moved into `removed.md`            |

- **Removal is a move, never a delete.** A ticker leaving the screen isn't a reason to
  lose that you'd already reviewed it, so it goes to `removed.md` under today's heading,
  carrying its tick state and note.
- **`removed.md` accumulates** across runs rather than being overwritten — it's a
  history of what the screen has dropped, not a diff of the last run.
- **A reappearing ticker is restored, not re-added.** If it's in `removed.md` when it
  comes back, it moves back into the checklist **with its old tick state and note**, and
  is dropped from the history. Otherwise a stock that briefly fell out of the screen
  would come back looking unreviewed, and get reviewed twice.
- **Re-running the same export is a no-op** — every ticker matches, nothing is written
  that changes meaning. The sync is idempotent, so it's safe to run when unsure.
- **Duplicate tickers are collapsed, first occurrence winning** — in the export, in
  `checklist.md`, and in `removed.md`. A repeated line in the checklist is much more
  likely to be a stray hand-edit than a correction, and the first copy is the one
  carrying the note; `removed.md` is written newest-first, so first-wins also means the
  most recent removal is the one that counts.
- **A missing `checklist.md` is a first run**, not an error. Lines that aren't
  `- [ ] TICKER` are ignored rather than treated as corruption, so hand-edits that break
  the shape lose at most the line they broke — never the whole file.

## File map

```
backend/stock-scanner/
├── build-checklist.mjs    # the sync: parse export -> add/restore/remove -> write both files
├── scanner-result.json    # raw TradingView export (input; filename is an argument)
├── checklist.md           # generated — current review list
└── removed.md             # generated — history of dropped tickers, grouped by run date
```

Plain `.mjs` run directly by node: no build step, no dependencies, no npm script. It's a
hand-run tool sitting beside its data, and keeping it dependency-free means it works
whatever state the workspace install is in.
