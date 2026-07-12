# Place Trade — Spec

## Purpose

The bridge from watching to trading: convert a watchlist item into a placed
trade through a short stepper that forces a pause before pulling the
trigger — trade parameters, then a stage/base read, then technical
confirmation, then 52-week range, then a written thesis, then a pre-trade
checklist, then a review before it's final.

> **The checklist content in step 3 is a mock.** `utils/checklistItems.ts`
> holds a placeholder list to validate the flow end to end. It'll be replaced
> with the trader's real checklist — nothing else about the flow changes when
> that happens, `ChecklistStep` just renders whatever list is there.

## Data

- **Reads**: the watchlist item being traded, via `useWatchlist()` from
  [trades.spec.md](trades.spec.md)'s sibling — see
  [watchlist.spec.md](watchlist.spec.md) — matched by the `:id` route param.
  Nothing is fetched by a dedicated endpoint; it's found in the already-loaded
  watchlist list.
- **Derived — live, never stored** (`utils/riskCalc.ts`):
  - `riskPerShare` = `(entry − stop) × direction` (`direction` = `+1` long, `−1` short)
  - `rewardPerShare` = `(target − entry) × direction`
  - `riskAmount` / `rewardAmount` = per-share × quantity
  - `riskRewardRatio` = `rewardPerShare / riskPerShare` (only when risk > 0)
  - `riskPercent` / `rewardPercent` = per-share risk/reward as a % of entry price
- **Stage & Base reference content** — lives in `utils/stageBaseOptions.ts` as
  static data (`STAGE_OPTIONS`, `BASE_OPTIONS`), not fetched or persisted. Each
  option carries a `tone` (`best` / `good` / `caution` / `bad` / `avoid`) used
  to color-code its risk level, a one-line `summary` (shown on the row), and
  `detailSections` — notes grouped by theme (icon + heading + points), shown
  in the hover card.
- **Indicators — derived, live, never stored** (`utils/indicatorCalc.ts`):
  - `aboveLowPercent` = `(entry − week52Low) / week52Low × 100`
  - `belowHighPercent` = `(week52High − entry) / week52High × 100`
  - `rsiTone(value)` — grades a single RSI reading `good` (≥80) / `caution`
    (70–79) / `bad` (<70), per the guideline that RSI shouldn't be below 70.
- **Writes, on submit**:
  1. `addTrade` (from `modules/trades`) — `POST /trades` with `symbol`, `side`
     (both carried over from the watchlist item), `quantity`, `entryPrice`,
     `entryTime` (now), `exitPrice: null`, `exitTime: null` (opens the trade —
     it shows as "open" on the Dashboard until later closed), and `notes`
     (the thesis + a `"Checklist: N/M confirmed"` summary).
  2. `removeItem` (from `useWatchlist`) — `DELETE /watchlist/:id`. Once placed,
     it's a trade, not something still being watched.

## UI

Reached by clicking **Place Trade** on a watchlist row (`WatchlistTable` —
a small pill button, `send` icon, next to Remove). Route:
`/watchlist/:id/place-trade`.

1. **Header** (`shared/PageHeader`) — `send` icon + "Place Trade" + subtitle.
2. **Step indicator** (`StepIndicator`) — 7 numbered steps, done ones get a
   checkmark, current is highlighted, connected by a line.
3. **Step body** — one of:
   - **Trade Setup** (`TradeParamsStep`) — entry price, quantity, stop loss,
     target (optional), with a live `RiskSummary` panel underneath. The panel
     leads with two large hero figures — "If stopped out" / "If target hit"
     as a signed % of entry, colored critical/good — with the $ amount, R:R
     ratio and per-share numbers as smaller supporting detail.
   - **Stage & Base** (`StageBaseStep`) — two single-select option lists,
     each row color-coded by risk (`tone`): a badge icon + colored verdict
     text + a one-line summary, plus an `i` trigger (`shared/HoverCard`) that
     reveals a rich panel of theme-grouped notes (`detailSections`) on
     hover/focus — not a native `title` tooltip.
     - **Stage** — where the stock sits in its trend: Stage 1 ("Poor trading
       area"), Transitioning 1→2 ("Wait & watch"), Stage 2 ("Good trading
       area"), Stage 3 ("Risky"), Stage 4 ("Too risky").
     - **Base** — quality of the base it's basing in/breaking out of: Base 1
       (best) through Base 4 (avoid). Not yet filled with real notes.
   - **Technical Confirmation** (`TechnicalConfirmationStep`) — a 3-item MA
     checklist (`INDICATOR_CHECKLIST_ITEMS`, reuses `ChecklistStep`) — MA
     uptrend, MA stack order, 200-day MA duration — followed by a divider,
     then Weekly RSI + Daily RSI number inputs, each field color-coded by
     `rsiTone` (good ≥80, caution 70–79, bad <70), with the "RSI shouldn't be
     below 70" guideline note underneath.
   - **52-Week Range** (`WeekRangeStep`) — 52-week low/high inputs, plus two
     live hero stats — "Above 52-week low" (good at ≥30%) and "Below 52-week
     high" (good at ≤25%) — each colored good/bad and paired with its
     guideline note.
   - **Confirm Your Edge** (`EdgeStep`) — a thesis textarea ("what's your
     edge, why does this setup work") and a Yes/No "aligned with your
     trading plan" toggle.
   - **Pre-Trade Checklist** (`ChecklistStep`) — MOCK checkbox list (see
     above), a "N of M confirmed" counter, nothing is required to proceed.
   - **Review & Place** (`ReviewStep`) — avatar + symbol + `SideBadge`,
     entry/qty/stop/target, the same live `RiskSummary`, the selected
     stage/base (colored to match their tone), the indicators summary
     (checklist count, RSI values, 52-week % stats), the thesis text, the
     aligned-with-plan answer, and the checklist with confirmed items styled
     distinctly from skipped ones.
4. **Footer** — Cancel (link back to Watchlist) on the left; Back / Next on
   the right, Next replaced by **Place Trade** on the last step.

## Behaviour

- **Step validation**: Next is disabled until the current step's required
  fields are filled — Setup needs `entryPrice` + `quantity`; Stage & Base
  needs both a `stage` and a `base` selected; Edge needs a non-empty thesis.
  Technical Confirmation, 52-Week Range, Checklist and Review have no hard
  requirement (they're prompts, not gates — the indicator steps are
  supporting data/confirmation, Checklist is a placeholder).
- Risk numbers recompute on every keystroke; any missing/invalid input shows
  `—` rather than `NaN` or throwing.
- On **Place Trade**: creates the trade, removes the watchlist item, then
  navigates to the Dashboard (`/`) where the new open trade appears.
- **States**: loading → "Loading…"; error → message; watchlist item not
  found (already placed or removed) → message + a link back to Watchlist.

## Module map

```
frontend/src/modules/place-trade/
├── PlaceTradePage.tsx           # loads the item, renders indicator + current step + footer nav
├── PlaceTradePage.css
├── index.ts                     # exports PlaceTradePage
├── types/placeTrade.ts          # TradeParams, StageBaseAnswers, IndicatorData, EdgeAnswers, ChecklistChecked
├── hooks/usePlaceTrade.ts       # step state, form state, canProceed, placeTrade()
├── utils/
│   ├── checklistItems.ts             # MOCK checklist — replace freely, see note above
│   ├── indicatorChecklistItems.ts    # INDICATOR_CHECKLIST_ITEMS (trend-confirmation checks)
│   ├── indicatorCalc.ts              # computeIndicatorRange(), rsiTone()
│   ├── riskCalc.ts                   # computeRisk(side, params) -> RiskCalc
│   └── stageBaseOptions.ts           # STAGE_OPTIONS / BASE_OPTIONS static reference content
└── components/
    ├── StepIndicator.tsx              # numbered progress row
    ├── TradeParamsStep.tsx            # entry/qty/stop/target inputs
    ├── RiskSummary.tsx                # live risk/reward panel (used in Setup and Review)
    ├── StageBaseStep.tsx              # stage/base single-select option lists + hover-card info
    ├── TechnicalConfirmationStep.tsx  # MA checklist + RSI data capture
    ├── WeekRangeStep.tsx              # 52-week low/high capture + live % stats
    ├── EdgeStep.tsx                   # thesis textarea + aligned-with-plan toggle
    ├── ChecklistStep.tsx              # renders a given `items` list as toggleable checkboxes
    └── ReviewStep.tsx                 # final summary before submit
```

Depends on `modules/trades` (`addTrade`, `NewTrade`) and `modules/watchlist`
(`useWatchlist`, `WatchlistItemWithMetrics`, `WatchSide`) — both now export
what's needed through their `index.ts` barrels. Also uses `shared/HoverCard`
for the stage/base info panel. `ChecklistStep` takes its `items` as a prop so
it's reused for both the Pre-Trade Checklist and Technical Confirmation's MA
checks.

**Not yet wired to the backend:** the selected `stage`/`base` and all
Technical Confirmation / 52-Week Range data aren't included in the `notes`
written on submit — UI-only for now, matches the current placeholder-
checklist pattern. Follow-up work will decide how (or whether) they should
be persisted on the trade.
