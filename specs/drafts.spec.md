# Drafts — Spec

## Purpose

A **draft** is a place-trade stepper run that's been parked instead of placed. The
stepper is seven steps long, and a setup deserves to be read carefully before capital
goes behind it — so a run is persisted as it's filled, can be closed and resumed later
from the same step, and can be deliberately kept at the Review step to be re-read.

Domain-only module: no page, no route. It's the data layer that
[place-trade.spec.md](place-trade.spec.md) (writes and resumes drafts) and
[watchlist.spec.md](watchlist.spec.md) (surfaces them on the row) both consume — see
convention 7 in [`../CLAUDE.md`](../CLAUDE.md). Both of those import it, so **`drafts`
imports neither of them** — it stays a leaf.

## Data

- **Source**: `/drafts`, from `backend/data/drafts.json` (starts as `[]`). No backend code
  needed — `merge-db.js` turns any file in `data/` into an endpoint.
- **Shape** (`types/draft.ts`): one draft per watchlist item, keyed by `watchlistId`.

  ```ts
  interface DraftStepperState {
    stepIndex: number // where to resume
    tradeParams: TradeParams
    stageBaseAnswers: StageBaseAnswers
    indicatorData: IndicatorData
    indicatorChecklistChecked: ChecklistChecked
    vcpStructureData: VcpStructureData
    finalChecksChecked: ChecklistChecked
  }

  interface TradeDraft extends DraftStepperState {
    id: string
    watchlistId: string
    createdAt: string
    updatedAt: string
  }
  ```

  The six form-state types (`TradeParams`, `StageBaseAnswers`, `IndicatorData`,
  `VcpContraction`, `VcpStructureData`, `ChecklistChecked`) are **defined here** and
  re-exported by `place-trade/types/placeTrade.ts` — a draft *is* the stepper's form
  state, so this is its canonical home. Same arrangement as `TradeStage`/`TradeBase`,
  which live in `modules/trades` because they're persisted on the trade.

- **Stored verbatim, as typed.** Every value is the raw **string** the input held — not a
  parsed number. Resuming has to restore what you typed (`"12.50"`, a half-finished
  `"1."`), not a re-rendering of it. Parsing happens once, at placement.
- **The rating is not stored.** It's derived live by `computeTradeRating()` from these
  answers on every render, and only frozen into the trade's `setup.rating` at the moment
  of placing (convention 4; `TradeRatingSnapshot` in [trades.spec.md](trades.spec.md)).
  A draft is an unfinished judgement — freezing one would mean re-freezing it on every
  keystroke.
- **Symbol and side are not denormalised** either; they come from the watchlist item,
  which is guaranteed to outlive the draft (see the two deletions below).

## Behaviour

- **One draft per watchlist item.** `fetchDraftFor(watchlistId)` (`GET /drafts?watchlistId=…`)
  is the lookup; there is no draft without a watchlist item behind it.
- **A draft is deleted, never orphaned**, in three places:
  1. the trade is **placed** — it's a trade now, not a run in progress (`usePlaceTrade`);
  2. the draft is **discarded from inside the stepper** — the only place discarding is
     offered, so you're looking at the setup you're throwing away (`usePlaceTrade`);
  3. the watchlist item is **removed** — nothing left to resume (`WatchlistPage`, via
     `useDrafts().discard`).

## Module map

```
frontend/src/modules/drafts/
├── types/draft.ts       # DraftStepperState, TradeDraft, NewTradeDraft + the six form-state types
├── api/draftsApi.ts     # fetchDrafts, fetchDraftFor, createDraft, updateDraft, removeDraft
├── hooks/useDrafts.ts   # every draft, indexed byWatchlistId, + discard() — for the Watchlist page
└── index.ts             # barrel
```

`createDraft` / `updateDraft` stamp `createdAt` / `updatedAt`. The per-run autosave hook
that drives them lives with the stepper that owns the state
(`place-trade/hooks/useDraftAutosave.ts`), not here.
