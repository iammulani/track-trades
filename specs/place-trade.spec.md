# Place Trade — Spec

## Purpose

The bridge from watching to trading: convert a watchlist item into a placed
trade through a short stepper that forces a pause before pulling the
trigger — trade parameters, then a stage/base read, then technical
confirmation, then 52-week range, then VCP structure, then a final
overhead-supply check, then a review before it's final.

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
  - `computeMaDistancePercent` = `(entry − fiftyDayMa) / fiftyDayMa × 100` —
    signed, positive when entry is above the 50-day MA.
  - `rsiTone(value)` — grades the RSI reading `good` (≥80) / `caution`
    (70–79) / `bad` (<70), per the guideline that RSI shouldn't be below 70.
  - `maDistanceTone(distancePercent)` — reads the entry's distance above the
    50-day MA as *extension*: `good` 0–5% (near support, not extended),
    `caution` 5–20% or up to 5% below the MA, `bad` >20% (extended — price has
    run past its base) or further below. Shown as a colored readout in Technical
    Confirmation, with an alert note when `caution`/`bad`.
- **VCP Structure — derived, live, never stored** (`utils/finalChecksCalc.ts`,
  used by `VcpStructureStep`). Each contraction (T) is a `{ high, low }` pair
  (2–6 of them, `MIN_VCP_CONTRACTIONS` / `MAX_VCP_CONTRACTIONS`); nothing else
  is entered directly:
  - `computeContractionPercent({high, low})` = `(high − low) / high × 100`.
  - `largestCorrectionPercent(contractions)` / `narrowestPullbackPercent(contractions)`
    = the max / min of all filled contraction %s.
  - `filledContractionCount(contractions)` = how many Ts have both sides filled.
  - `contractionTightnessTone(contractions, index)` — per-row check: `good` if
    that contraction's % is ≤ the previous one's (or it's T1, no baseline yet),
    `bad` if it's wider than the previous one (the base isn't tightening).
  - `weeksInBaseTone` — good 5–26 weeks, bad <5 (hasn't shaken out weak
    holders), caution >26 (losing its edge).
  - `largestCorrectionTone(contractions)` — good ≤35%, caution 35–50%, bad >50%
    (the deepest contraction of a proper VCP commonly runs 25–35%; it's the
    *tightening* that matters, not a shallow first leg).
  - `contractionsTightening(contractions)` — true when there are ≥2 filled
    contractions and each is ≤ the one before it (the defining VCP property).
  - `narrowestPullbackTone(contractions)` — good ≤10%, caution 10–15%, bad >15%
    (the right-most contraction should be tight going into the pivot).
  - `contractionCountTone(contractions)` — good 2–4 (a proper VCP), bad <2 (no
    tightening shown yet), caution ≥5 (base getting choppy).
- **Trade Rating — derived, live, never stored** (`utils/tradeRating.ts`):
  `computeTradeRating()` scores 9 **weighted** criteria, each with a `score` of
  0..1 (partial credit — a `caution` tone reads as half, a checklist scores the
  fraction ticked) rather than a binary star. Each reuses its own step's
  tone/threshold logic. The overall `ratio` = Σ(weight·score) / Σ(weight):
  1. Risk : Reward (weight 2) — 1 if ≥2, ½ if 1–2, else 0 (Trade Setup)
  2. Stage tone (weight 1) — `toneScore` of the stage tone (Stage & Base)
  3. Base tone (weight 1) — `toneScore` of the base tone (Stage & Base)
  4. MA structure (weight 1) — fraction of the 3 MA checks ticked (Technical Confirmation)
  5. Relative strength (weight 1) — `toneScore(rsiTone)`, so 70–79 earns half (Technical Confirmation)
  6. MA proximity (weight 1) — `toneScore(maDistanceTone)`; extended entries lose it (Technical Confirmation)
  7. 52-week range (weight 1) — ½ for `aboveLowPercent` ≥30 + ½ for `belowHighPercent` ≤25 (52-Week Range)
  8. VCP structure (weight 2) — fraction of 5 sub-conditions met: weeks-in-base,
     largest-correction, narrowest-pullback and contraction-count tones all `good`,
     plus `contractionsTightening` (VCP Structure)
  9. Final Checks (weight 1) — fraction of all 6 overhead-supply + breakout boxes ticked
  Weights lift the decisive-but-underrepresented reads (Risk:Reward, VCP) and
  keep the three correlated "in an uptrend" criteria (stage, MA, 52-week range) at
  weight 1 each so trend isn't triple-counted. `ratingVerdict()` reads `ratio` as a
  quick label: "Excellent setup" (≥85%), "Good setup" (≥50%), or "Weak setup —
  reconsider" (below that).
- **Writes, on submit**:
  1. `addTrade` (from `modules/trades`) — `POST /trades` with `symbol`, `side`
     (both carried over from the watchlist item), `quantity`, `entryPrice`,
     `entryTime` (now), `exitPrice: null`, `exitTime: null` (opens the trade —
     it shows as "open" on the Dashboard until later closed).
  2. `removeItem` (from `useWatchlist`) — `DELETE /watchlist/:id`. Once placed,
     it's a trade, not something still being watched.

## UI

Reached by clicking **Place Trade** on a watchlist row (`WatchlistTable` —
a small pill button, `send` icon, next to Remove). Route:
`/watchlist/:id/place-trade`.

1. **Header** (`shared/PageHeader`) — `send` icon + "Place Trade" + subtitle.
2. **Step indicator** (`StepIndicator`) — 7 numbered dots only (no text
   labels — they no longer fit once there were 7 steps), done ones get a
   checkmark, current is highlighted, connected by a line. Each dot carries
   its step title as a native tooltip; the current step's full title is
   shown separately as the page heading below.
3. **Trade Rating** (`TradeRatingBadge`) — sits next to the symbol in the
   step-title row on every step, and again (bigger, with a verdict label) at
   the top of Review. Shows a row of 7 stars filled **proportionally** to the
   score (an outline row with an identical filled row clipped to `ratio`, so
   partial credit shows as a partly-filled star — no half-star glyph needed)
   plus a percentage from `computeTradeRating()`, live across whatever's been
   entered so far. An `i` hover-card (via `HoverCard`'s
   `triggerClassName="hover-card__trigger--plain"` escape hatch, since the
   default trigger is a small fixed-size circle) lists all 9 criteria, each with
   a check (fully met), an amber alert (partial), or an x (unmet).
4. **Step body** — one of:
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
     then an RSI slider (range 50–90, step 1, defaults to 70) with a live
     numeric readout colored by `rsiTone` (good ≥80, caution 70–79, bad <70)
     and the "RSI shouldn't be below 70" guideline note underneath, then a
     50-day MA price input paired with a live "from trading price" signed %
     (via `computeMaDistancePercent`).
   - **52-Week Range** (`WeekRangeStep`) — 52-week low/high inputs (both
     required to proceed), plus two live hero stats — "Above 52-week low"
     (good at ≥30%) and "Below 52-week high" (good at ≤25%) — each colored
     good/bad and paired with its guideline note.
   - **VCP Structure** (`VcpStructureStep`) — an `i` trigger next to the
     heading opens a worked example (Meridian Bioscience Inc. / VIVO, cited
     to p. 202) showing four tightening contractions (31% → 17% → 8% → 3%)
     into the pivot. Below a divider, a *Time* block (weeks in base, color-coded
     by `weeksInBaseTone`), then *Price & Symmetry*: a dynamic list of
     contraction rows (T1, T2, ...; 2–6 of them, add/remove buttons respect
     the min/max), each with a High and Low price input — the % pullback is
     calculated and shown per row (no manual % entry), color-coded green/red
     by `contractionTightnessTone` against the previous row so a contraction
     that's wider than the last one stands out with a warning icon. Below the
     list, a live summary (largest correction, narrowest pullback) derived
     from all filled rows, plus the guideline note.
   - **Final Checks** (`FinalChecksStep`) — two sections separated by a
     divider, built to hold more as they're added:
     - **Overhead Supply** — a 2-item checklist (`OVERHEAD_SUPPLY_CHECKLIST_ITEMS`,
       reuses `ChecklistStep`) covering volume/price quieting down on the
       right side of the base and enough time passing for weak holders to be
       shaken out — plus an `i` trigger next to the heading (`shared/HoverCard`)
       explaining the reasoning in theme-grouped sections (where supply comes
       from, what a healthy VCP looks like, why to be patient, the warning
       sign that supply hasn't cleared). The "contractions tightening"
       checklist item lives in VCP Structure instead, as a quantitative count.
     - **Breakout Confirmation** — a 4-item checklist
       (`BREAKOUT_CONFIRMATION_CHECKLIST_ITEMS`, reuses `ChecklistStep`)
       covering market trend, industry group strength, volume confirming the
       breakout, and minimal overhead resistance — plus an `i` trigger
       explaining the reasoning (what to confirm, the "never overlook poor
       volume" warning sign, and why overhead resistance matters).
   - **Review & Place** (`ReviewStep`) — avatar + symbol + `SideBadge`, the big
     rating banner, then a **"Why N%?" breakdown** — every criterion listed with
     its state icon and the points it contributed out of its weight
     (`criterionPoints` / `weight`), headed by the running
     `earnedWeight` / `totalWeight` total, so the score always reconciles on
     screen. Dropped points are what the reader is scanning for, so partial rows
     get an amber background and unmet rows a red one. Then
     entry/qty/stop/target, the same live `RiskSummary`, the selected
     stage/base (colored to match their tone), the indicators summary
     (checklist count, RSI, 50-day MA + distance, 52-week % stats), the VCP
     Structure values, the overhead-supply checklist, and the
     breakout-confirmation checklist — confirmed checklist items styled
     distinctly from skipped ones.
5. **Footer** — Cancel (link back to Watchlist) on the left; Back / Next on
   the right, Next replaced by **Place Trade** on the last step.

## Behaviour

- **Step validation**: Next is disabled until the current step's required
  fields are filled — Setup needs `entryPrice` + `quantity`; Stage & Base
  needs both a `stage` and a `base` selected; 52-Week Range needs both
  `week52Low` and `week52High`. Technical Confirmation, VCP Structure, Final
  Checks and Review have no hard requirement (they're prompts, not gates).
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
├── types/placeTrade.ts          # TradeParams, StageBaseAnswers, IndicatorData, VcpStructureData, ChecklistChecked
├── hooks/usePlaceTrade.ts       # step state, form state, canProceed, placeTrade()
├── utils/
│   ├── checklistItems.ts             # ChecklistItem — shared shape for every step's checklist
│   ├── indicatorChecklistItems.ts    # INDICATOR_CHECKLIST_ITEMS (trend-confirmation checks)
│   ├── indicatorCalc.ts              # computeIndicatorRange(), computeMaDistancePercent(), rsiTone()
│   ├── finalChecksItems.ts           # OVERHEAD_SUPPLY_CHECKLIST_ITEMS, BREAKOUT_CONFIRMATION_CHECKLIST_ITEMS
│   ├── finalChecksCalc.ts            # computeContractionPercent(), largest/narrowestFromContractions, weeksInBaseTone(), largestCorrectionTone(), narrowestPullbackTone(), contractionCountTone(), contractionTightnessTone()
│   ├── riskCalc.ts                   # computeRisk(side, params) -> RiskCalc
│   ├── stageBaseOptions.ts           # STAGE_OPTIONS / BASE_OPTIONS static reference content
│   └── tradeRating.ts                # computeTradeRating(), ratingVerdict(), criterionState()/criterionPoints()/CRITERION_STATE_ICON (shared by the badge hover-card and the Review breakdown)
└── components/
    ├── StepIndicator.tsx              # numbered progress row (dots only, no labels)
    ├── TradeRatingBadge.tsx            # star row + N/7 count + hover-card breakdown
    ├── TradeParamsStep.tsx            # entry/qty/stop/target inputs
    ├── RiskSummary.tsx                # live risk/reward panel (used in Setup and Review)
    ├── StageBaseStep.tsx              # stage/base single-select option lists + hover-card info
    ├── TechnicalConfirmationStep.tsx  # MA checklist + RSI slider + 50-day MA capture
    ├── WeekRangeStep.tsx              # 52-week low/high capture + live % stats
    ├── ChecklistStep.tsx              # renders a given `items` list as toggleable checkboxes
    ├── VcpStructureStep.tsx           # time/price/symmetry capture + hover-card worked example
    ├── FinalChecksStep.tsx            # overhead-supply checklist + hover-card reasoning
    └── ReviewStep.tsx                 # final summary before submit, incl. the rating banner + "Why N%?" breakdown
```

Depends on `modules/trades` (`addTrade`, `NewTrade`) and `modules/watchlist`
(`useWatchlist`, `WatchlistItemWithMetrics`, `WatchSide`) — both now export
what's needed through their `index.ts` barrels. Also uses `shared/HoverCard`
for the stage/base, VCP Structure, and overhead-supply info panels — it
sizes itself to the content (up to 460px wide, scrolling internally past
~520px tall) and picks whichever side/direction has room, so it always
stays fully on-screen. `ChecklistStep` takes its `items` as a prop so it's
reused across Technical Confirmation's MA checks and Final Checks'
overhead-supply / breakout-confirmation checks.

**Not yet wired to the backend:** the selected `stage`/`base` and all
Technical Confirmation / 52-Week Range / VCP Structure / Final Checks data
aren't included in the trade written on submit — UI-only for now. Follow-up
work will decide how (or whether) they should be persisted on the trade.
