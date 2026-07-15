# Place Trade — Spec

## Purpose

The bridge from watching to trading: convert a watchlist item into a placed
trade through a short stepper that forces a pause before pulling the
trigger — trade parameters, then a stage/base read, then technical
confirmation, then 52-week range, then VCP structure, then a final
overhead-supply check, then a review before it's final.

It's a long walk, so it doesn't have to be done in one sitting: the run is saved
as a **draft** as you fill it and can be resumed later, and Review offers **Keep
as Draft** alongside Place Trade — so a finished setup can be parked and re-read
before capital goes behind it. See [drafts.spec.md](drafts.spec.md).

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
  - `rsRatingTone(value)` — grades the **RS Rating** `good` (≥80) / `caution`
    (70–79) / `bad` (<70), per the guideline that it shouldn't be below 70. This
    is the IBD-style RS Rating — a 1–99 percentile of the stock's strength against
    the whole market — *not* RSI(14), which is why the slider spans the full 1–99.
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
- **Stop placement — derived, live, never stored** (`utils/stopPlacement.ts`):
  `checkStopPlacement(side, entryPrice, stopLoss, contractions)` judges *where* the stop
  sits, not just the ratio it produces. Two independent reads, each `null` until its
  inputs exist (which the gate treats as pending, never as a failure):
  - `beyondBase` — is the stop past the **last filled contraction's** low (long) / high
    (short)? That's the level the thesis has to break to reach. A stop inside the base
    flatters the risk:reward on paper while guaranteeing a shake-out on ordinary noise.
  - `sizeOk` — is `riskPercent` within `MIN_RISK_PERCENT` (2) … `MAX_RISK_PERCENT` (10)?
    Tighter than 2% is inside daily noise; wider than 10% is simply oversized.

  `stopPlacementScore()` gives each condition half, so a stop that clears the base but is
  sized wrong shows partial credit rather than reading as a total miss.
- **Trade Rating — live in the stepper, then frozen on placement**
  (`utils/tradeRating.ts`). Unlike everything else here it is *not* re-derived later:
  `computeTradeRating()` runs live while you fill the stepper, and
  `toRatingSnapshot()` freezes the result into the trade on submit, because a rating
  is a judgement whose formula will be re-tuned — see `TradeRatingSnapshot` in
  [trades.spec.md](trades.spec.md).
  `computeTradeRating()` scores the setup out of **`RATING_STARS` = 5**. It has two
  layers — **gates cap, criteria score** — because a flat weighted average lets a
  setup that breaks a Minervini non-negotiable average its way back to a passing
  grade off its other criteria.

  **Gates (`RatingGate[]`) — the non-negotiables.** Each has a `state` of `pass` /
  `fail` / **`pending`** (the inputs it reads aren't entered yet, so it can't judge —
  a pending gate must *never* cap, or the badge would read red on step 1). A failed
  gate imposes a hard ceiling: `ratio = min(rawRatio, ...every failed gate's cap)`.
  | gate | passes when | cap |
  |---|---|---|
  | `stage-2` | the stage is Stage 2 | **0.40** (2.0★) |
  | `trend-template` | all 3 MA checks ticked, `aboveLowPercent` ≥30, `belowHighPercent` ≤25 | 0.60 |
  | `logical-stop` | `checkStopPlacement` says the stop is beyond the base **and** sized 2–10% | 0.60 |
  | `real-base` | ≥5 weeks in base, ≥2 filled contractions, and `contractionsTightening` | 0.60 |

  **Criteria (`RatingCriterion[]`) — the weighted score.** Each has a `score` of 0..1
  (partial credit — a `caution` tone reads as **0.3**, a checklist scores the fraction
  ticked) and reuses its own step's tone/threshold logic. `rawRatio` = Σ(weight·score)
  / Σ(weight):
  1. Risk : Reward (weight 2) — 1 if ≥2, ½ if 1–2, else 0. **Omitted from the criteria
     list entirely when no target is set** (there's no reward to measure — it's
     unmeasurable, not bad — so `totalWeight` is 12 rather than 14), and **scored 0
     whenever the `logical-stop` gate fails**: a great ratio measured off a stop parked
     inside the base isn't a real ratio, it's the artefact of a stop too tight to survive.
  2. Stop placement (weight 1) — ½ for a stop beyond the base + ½ for risk sized 2–10%
  3. Stage tone (weight 2) — `toneScore` of the stage tone (Stage & Base)
  4. Base tone (weight 1) — `toneScore` of the base tone (Stage & Base)
  5. MA structure (weight 1) — fraction of the 3 MA checks ticked (Technical Confirmation)
  6. Relative strength (weight 1) — `toneScore(rsRatingTone)`, so 70–79 earns 0.3
  7. 52-week range (weight 2) — ½ for `aboveLowPercent` ≥30 + ½ for `belowHighPercent` ≤25
  8. VCP structure (weight 3) — fraction of 5 sub-conditions met: weeks-in-base,
     largest-correction, narrowest-pullback and contraction-count tones all `good`,
     plus `contractionsTightening` (VCP Structure)
  9. Final Checks (weight 1) — fraction of all 6 overhead-supply + breakout boxes ticked

  The 50-day MA itself is still captured in Technical Confirmation, and still shows a
  color-coded good/caution/bad reading of how extended the entry is above/below it (plus
  an alert message on caution/bad) — `computeMaDistancePercent`/`maDistanceTone` in
  `utils/indicatorCalc.ts`. It's just no longer a scored criterion: it's a warning to the
  trader, not a rating input. (Trades rated before this change keep their frozen
  `ma-proximity` criterion in the snapshot — `fromRatingSnapshot` still has a label for it —
  so old ratings don't change retroactively.)

  Weights lift the reads that carry the thesis (VCP, stage, the 52-week range) over the
  ones that merely corroborate it. `TradeRating` exposes `ratio` (capped — the score that
  counts), `rawRatio` (criteria only, what the points breakdown reconciles to), `stars`
  (`ratio × RATING_STARS`), `criteria` and `gates`; `bindingGates()` returns the failed
  ones, tightest cap first. `ratingVerdict()` reads `ratio` as a label — "Excellent setup"
  (≥85%), "Good setup" (≥70%), "Marginal — tighten up" (≥55%), "Weak setup — don't trade"
  (below that). The bands are deliberately unforgiving: a setup that half-meets everything
  is a no-trade, not a good one.
- **Writes, on submit**:
  1. `addTrade` (from `modules/trades`) — `POST /trades` with `symbol`, `side`
     (both carried over from the watchlist item), `quantity`, `entryPrice`,
     `entryTime` (from the Trade Setup step's entry date, combined with the
     current time-of-day — defaults to today but can be backdated),
     `exitPrice: null`, `exitTime: null` (opens the trade — it shows as
     "open" on the Dashboard until later closed), and `setup` — every answer
     collected by the stepper (stop/target, stage/base, technical readings +
     checklist, 52-week range, VCP structure, final-checks checklist), plus
     `rating: toRatingSnapshot(rating)` — the **whole** rating frozen as it stood at
     the moment of placing (score, every criterion's points, every gate's
     pass/fail and its cap), and the watchlist item's `watchedSince` so how long
     it was watched before being traded isn't lost. Written once, never updated
     and **never recomputed** — see `TradeRatingSnapshot` in
     [trades.spec.md](trades.spec.md) for why the rating is stored rather than
     derived. Viewable afterward via the read-only Trade Detail page, which reads
     the snapshot back with `fromRatingSnapshot()` — see
     [trade-detail.spec.md](trade-detail.spec.md).
  2. `removeItem` (from `useWatchlist`) — `DELETE /watchlist/:id`. Once placed,
     it's a trade, not something still being watched.
  3. `removeDraft` (from `modules/drafts`) — `DELETE /drafts/:id`, if this run was
     resumed from or auto-saved into a draft. It's a trade now, not a run in progress.
- **Writes, continuously** — the draft (`hooks/useDraftAutosave.ts`). See
  [drafts.spec.md](drafts.spec.md) for the record; the stepper's whole form state plus
  its `stepIndex`, debounced, `POST` on the first write and `PATCH` after. The rating is
  *not* part of it — it's re-derived live on resume, and only frozen at placement.

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
   the top of Review. Renders `RatingStars` — a row of **5** stars filled
   **proportionally** to the score (an outline row with an identical filled row
   clipped to `ratio`, so partial credit shows as a partly-filled star — no
   half-star glyph needed) — labelled `3.7 / 5 · 73%`, live across whatever's been
   entered so far. The percentage stays alongside the stars so it still reconciles
   with the points breakdown. An `i` hover-card (via `HoverCard`'s
   `triggerClassName="hover-card__trigger--plain"` escape hatch, since the
   default trigger is a small fixed-size circle) lists the 4 **non-negotiables**
   first — pass / fail / pending — then the scored criteria, each with a check
   (fully met), an amber alert (partial), or an x (unmet).
4. **Step body** — one of:
   - **Trade Setup** (`TradeParamsStep`) — a required **entry date** (defaults
     to today, can be backdated but not set in the future — lets a trade
     placed earlier be logged with its real date instead of today's), entry
     price, quantity, stop loss, target (optional), with a live `RiskSummary`
     panel underneath. The panel
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
     then an **RS Rating** slider (range 1–99, step 1, defaults to 70 — it's a
     market-wide percentile, so the scale has to be able to say "30") with a live
     numeric readout colored by `rsRatingTone` (good ≥80, caution 70–79, bad <70)
     and the "RS Rating shouldn't be below 70" guideline note underneath, then a
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
     rating banner (`RatingStars` + `N / 5` + verdict), then — when any gate failed
     — a red **`RatingGateBanner`**, then a **"Why N% on points?" breakdown** — every
     criterion listed with its state icon and the points it contributed out of its
     weight (`criterionPoints` / `weight`), headed by the running
     `earnedWeight` / `totalWeight` total, so the score always reconciles on
     screen. The heading quotes `rawRatio`, not `ratio` — the criteria sum to the
     *uncapped* score, and the gate banner above accounts for the difference.
     Dropped points are what the reader is scanning for, so partial rows
     get an amber background and unmet rows a red one. Then
     entry/qty/stop/target, the same live `RiskSummary`, the selected
     stage/base (colored to match their tone), the indicators summary
     (checklist count, RSI, 50-day MA + distance, 52-week % stats), the VCP
     Structure values, the overhead-supply checklist, and the
     breakout-confirmation checklist — confirmed checklist items styled
     distinctly from skipped ones.
5. **Footer** — on the left: Cancel (link back to Watchlist), then — only once a
   draft exists — a quiet **Discard draft** button (turns red on hover) and the live
   draft status ("Saving draft…" / "Draft saved · Jun 2, 09:35"). On the right:
   Back / Next, with Next replaced on the last step by **Keep as Draft**
   (secondary, `clock` icon — saves and returns to the Watchlist) next to **Place
   Trade**. A "Draft" pill sits next to the symbol in the step-title row whenever
   the run is backed by a draft.
6. **Discard confirmation** (`shared/ConfirmDialog`) — "Discard this draft?", naming
   the symbol, noting the answers are lost but the symbol stays on the watchlist.
   Confirm ("Discard") / cancel ("Keep it").

## Behaviour

- **Step validation**: Next is disabled until the current step's required
  fields are filled — Setup needs `entryDate` + `entryPrice` + `quantity`; Stage & Base
  needs both a `stage` and a `base` selected; 52-Week Range needs both
  `week52Low` and `week52High`. Technical Confirmation, VCP Structure, Final
  Checks and Review have no hard requirement (they're prompts, not gates).
- Risk numbers recompute on every keystroke; any missing/invalid input shows
  `—` rather than `NaN` or throwing.
- On **Place Trade**: creates the trade, removes the watchlist item, deletes the
  draft, then navigates to the Dashboard (`/`) where the new open trade appears.
- **Drafts** (`hooks/useDraftAutosave.ts`):
  - **Hydrate first.** On mount the parked draft is looked up by the `:id` route param;
    the stepper renders "Loading…" until that resolves, then seeds every step's state
    from it — **including `stepIndex`, so you resume on the step you left**. No draft
    → a fresh run.
  - **Auto-save.** Every change (any step's answers, or moving between steps) is written
    back, debounced 800ms — closing the tab or reloading mid-stepper loses nothing.
    Leaving the page flushes whatever is still pending.
  - **No junk drafts.** Nothing is written until the state differs from an untouched run,
    so opening the stepper and hitting Cancel doesn't park an empty draft.
  - **Keep as Draft** (Review step) flushes the save and returns to the Watchlist — the
    point being that you can come back and re-read the Review page's rating, gate banner
    and points breakdown before committing.
  - **Discard draft** deletes it (after confirming) and returns to the Watchlist, leaving
    the symbol on the list. It is offered **only from inside the stepper**, never as a
    second button on the watchlist row: throwing away a setup you spent seven steps on
    should mean looking at it first.
  - A failed draft lookup or save never blocks the stepper: the run continues unsaved.
- **States**: loading → "Loading…" (covers both the watchlist fetch and the draft
  lookup); error → message; watchlist item not found (already placed or removed) →
  message + a link back to Watchlist.

## Module map

```
frontend/src/modules/place-trade/
├── PlaceTradePage.tsx           # loads the item, renders indicator + current step + footer nav
├── PlaceTradePage.css
├── index.ts                     # exports PlaceTradePage
├── types/placeTrade.ts          # EMPTY_* seeds, MIN/MAX_VCP_CONTRACTIONS, Stage/Base; re-exports the
│                                #   form-state types (TradeParams, StageBaseAnswers, IndicatorData,
│                                #   VcpStructureData, ChecklistChecked) from modules/drafts
├── hooks/usePlaceTrade.ts       # step state, form state, canProceed, placeTrade(), saveDraftAndExit(), discardDraft()
├── hooks/useDraftAutosave.ts    # hydrate from /drafts, debounce-write back, discard on placement
├── utils/
│   ├── checklistItems.ts             # ChecklistItem — shared shape for every step's checklist
│   ├── indicatorChecklistItems.ts    # INDICATOR_CHECKLIST_ITEMS (trend-confirmation checks)
│   ├── indicatorCalc.ts              # computeIndicatorRange(), computeMaDistancePercent(), rsiTone()
│   ├── finalChecksItems.ts           # OVERHEAD_SUPPLY_CHECKLIST_ITEMS, BREAKOUT_CONFIRMATION_CHECKLIST_ITEMS
│   ├── finalChecksCalc.ts            # computeContractionPercent(), largest/narrowestFromContractions, weeksInBaseTone(), largestCorrectionTone(), narrowestPullbackTone(), contractionCountTone(), contractionTightnessTone()
│   ├── riskCalc.ts                   # computeRisk(side, params) -> RiskCalc
│   ├── stopPlacement.ts              # checkStopPlacement() / stopPlacementScore() — is the stop beyond the base, and sized 2-10%?
│   ├── stageBaseOptions.ts           # STAGE_OPTIONS / BASE_OPTIONS static reference content
│   └── tradeRating.ts                # computeTradeRating() (live, in the stepper), toRatingSnapshot()/fromRatingSnapshot() (freeze at placement / read back on Trade Detail — never re-judge), GATE_META + CRITERION_LABELS (the prose, keyed by the persisted ids), ratingVerdict(), bindingGates(), RATING_STARS, criterionState()/criterionPoints()/formatPoints()/formatStars()/CRITERION_STATE_ICON
└── components/
    ├── StepIndicator.tsx              # numbered progress row (dots only, no labels)
    ├── RatingStars.tsx                # the 5-star row (outline + clipped fill) — shared by the badge, Review and Trade Detail
    ├── RatingGateBanner.tsx           # the failed non-negotiables + the ceiling they impose; renders nothing when all pass
    ├── TradeRatingBadge.tsx            # RatingStars + "N / 5 · P%" + hover-card breakdown (gates, then criteria)
    ├── TradeParamsStep.tsx            # entry/qty/stop/target inputs
    ├── RiskSummary.tsx                # live risk/reward panel (used in Setup and Review)
    ├── StageBaseStep.tsx              # stage/base single-select option lists + hover-card info
    ├── TechnicalConfirmationStep.tsx  # MA checklist + RSI slider + 50-day MA capture
    ├── WeekRangeStep.tsx              # 52-week low/high capture + live % stats
    ├── ChecklistStep.tsx              # renders a given `items` list as toggleable checkboxes
    ├── VcpStructureStep.tsx           # time/price/symmetry capture + hover-card worked example
    ├── FinalChecksStep.tsx            # overhead-supply checklist + hover-card reasoning
    └── ReviewStep.tsx                 # final summary before submit, incl. the rating banner, gate banner + "Why N%?" breakdown
```

Depends on `modules/trades` (`addTrade`, `NewTrade`, `TradeStage`, `TradeBase`),
`modules/watchlist` (`useWatchlist`, `WatchlistItemWithMetrics`, `WatchSide`)
and `modules/drafts` (the draft API + the form-state types) — all export what's
needed through their `index.ts` barrels. `place-trade`'s own `Stage`/`Base` types
are re-exports of `TradeStage`/`TradeBase` — `modules/trades` is the canonical
definition since the choice is now persisted as part of the trade's `setup` —
and the form-state types are re-exports from `modules/drafts` for the same
reason: they're what a draft stores (see [drafts.spec.md](drafts.spec.md)). Also uses
`shared/HoverCard` for the stage/base, VCP Structure, and overhead-supply
info panels — it sizes itself to the content (up to 460px wide, scrolling
internally past ~520px tall) and picks whichever side/direction has room, so
it always stays fully on-screen. `ChecklistStep` takes its `items` as a prop
so it's reused across Technical Confirmation's MA checks and Final Checks'
overhead-supply / breakout-confirmation checks. `shared/utils/dateInput.ts`
(`todayDateValue`, `dateValueToIso`) backs the entry-date field — the same
helper the watchlist's "watching since" date uses (see
[watchlist.spec.md](watchlist.spec.md)).
