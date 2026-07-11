# Place Trade — Spec

## Purpose

The bridge from watching to trading: convert a watchlist item into a placed
trade through a short stepper that forces a pause before pulling the
trigger — trade parameters, then a written thesis, then a pre-trade
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
2. **Step indicator** (`StepIndicator`) — 4 numbered steps, done ones get a
   checkmark, current is highlighted, connected by a line.
3. **Step body** — one of:
   - **Trade Setup** (`TradeParamsStep`) — entry price, quantity, stop loss,
     target (optional), with a live `RiskSummary` panel underneath
     (risk/share, reward/share, $ at risk, $ potential, R:R ratio).
   - **Confirm Your Edge** (`EdgeStep`) — a thesis textarea ("what's your
     edge, why does this setup work") and a Yes/No "aligned with your
     trading plan" toggle.
   - **Pre-Trade Checklist** (`ChecklistStep`) — MOCK checkbox list (see
     above), a "N of M confirmed" counter, nothing is required to proceed.
   - **Review & Place** (`ReviewStep`) — avatar + symbol + `SideBadge`,
     entry/qty/stop/target, the same live `RiskSummary`, the thesis text,
     the aligned-with-plan answer, and the checklist with confirmed items
     styled distinctly from skipped ones.
4. **Footer** — Cancel (link back to Watchlist) on the left; Back / Next on
   the right, Next replaced by **Place Trade** on the last step.

## Behaviour

- **Step validation**: Next is disabled until the current step's required
  fields are filled — Setup needs `entryPrice` + `quantity`; Edge needs a
  non-empty thesis. Checklist and Review have no hard requirement (the
  checklist is a prompt, not a gate — mirrors the fact it's a placeholder).
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
├── types/placeTrade.ts          # TradeParams, EdgeAnswers, ChecklistChecked
├── hooks/usePlaceTrade.ts       # step state, form state, canProceed, placeTrade()
├── utils/
│   ├── checklistItems.ts        # MOCK checklist — replace freely, see note above
│   └── riskCalc.ts              # computeRisk(side, params) -> RiskCalc
└── components/
    ├── StepIndicator.tsx        # numbered progress row
    ├── TradeParamsStep.tsx      # entry/qty/stop/target inputs
    ├── RiskSummary.tsx          # live risk/reward panel (used in Setup and Review)
    ├── EdgeStep.tsx             # thesis textarea + aligned-with-plan toggle
    ├── ChecklistStep.tsx        # renders CHECKLIST_ITEMS as toggleable checkboxes
    └── ReviewStep.tsx           # final summary before submit
```

Depends on `modules/trades` (`addTrade`, `NewTrade`) and `modules/watchlist`
(`useWatchlist`, `WatchlistItemWithMetrics`, `WatchSide`) — both now export
what's needed through their `index.ts` barrels.
