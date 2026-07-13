# Report — Spec

## Purpose

The consolidated review of the journal: **what the trading returned** (performance) and
**whether the rules were followed getting there** (process). Both halves carry equal
weight, because they answer different questions and fail in different ways — a good setup
mismanaged and a bad setup taken anyway are not the same mistake, and averaging them hides
both.

At a small sample the process half is the one that can be acted on. Rules broken are
countable from trade one; expectancy is not.

## Data

- **Source:** the shared trade domain via `useTrades()` — see [trades.spec.md](trades.spec.md).
  The Report fetches nothing of its own and persists nothing.
- **Only closed trades** are analysed (`buildReportTrades`), each paired with:
  - its **realized R-multiple** — `computeExitPreview(trade, exitPrice, setup.stopLoss).riskRewardRatio`,
    the same function the exit form uses for its live preview, so R means one thing in the
    whole app. `null` when the trade has no stop.
  - its **frozen setup rating** — `setup.rating` (`TradeRatingSnapshot`). `null` for trades
    placed before the rating existed.

**The report never re-judges a trade.** The gates and criteria were decided at placement
and stored (that is the entire point of `TradeRatingSnapshot` — see the doc comment on
`modules/trades/types/trade.ts`). `fromRatingSnapshot` is used only to look each gate's and
criterion's *wording* back up by id. Re-deriving a verdict from the raw setup here would let
a rule mean one thing on the Trade Detail page and another in the report.

### Derived

| Value | Formula |
|---|---|
| `expectancyR` | mean realized R across trades that have one |
| `profitFactor` | gross profit ÷ gross loss — **`null` with no winners**, never `0`/`Infinity` |
| `payoffRatio` | avg win ÷ avg loss — **`null` with no winners** |
| `maxDrawdown` | deepest peak-to-trough fall in cumulative P&L, walked in exit order |
| `stopLeaks` | count of trades with R < −1 — lost more than the risk they planned |
| `tradedAgainstRating` | count where `ratingVerdict(rating.ratio).tone === 'bad'` |
| gate `complianceRatio` | passed ÷ (passed + failed). **`pending` gates are excluded from the denominator**, never counted as failures |
| gate `leakCost` | summed P&L of the trades that failed that gate — the rupee price of breaking it |
| criterion `avgScore` | mean of the stored 0..1 scores. Criteria don't share a denominator — `risk-reward` is dropped from the rating when a trade has no target |

## UI

Top to bottom:

1. **Header** (`shared/PageHeader`, icon `report`).
2. **Sample banner** — "Based on N closed trades." Below 10, states plainly that the process
   figures are already worth reading but expectancy / profit factor / payoff ratio are **not
   yet statistically meaningful**. The page must never flatter itself at small n.
3. **Performance** — eight KPI tiles (`shared/StatTile`): Net P&L · Win rate · Expectancy (R) ·
   Profit factor · Payoff ratio · Max drawdown · Avg hold winners · Avg hold losers. Anything
   undefined renders `—` with a reason ("Undefined until a trade wins").
   - **R-multiple chart** — one signed bar per closed trade in exit order, with a dashed
     **−1R reference line**. Honouring the stop puts a floor at −1R, so a bar through that
     line is a stop that leaked; those bars get an amber ring, not just a colour.
4. **Process**
   - **Discipline tiles** — *Traded against the rating* (placed while the score read "don't
     trade"), *Stop leaks*, *Self-flagged mistakes*. These are the numbers that mean
     something at n=4.
   - **Gate scorecard** — one row per non-negotiable, **worst compliance first**, each with
     its compliance bar, its `leakCost`, and an expandable panel showing the gate's own
     stored `reason` prose plus the offending symbols.
   - **Setup quality vs. outcome** — scatter of rating at entry (x) against realized R (y),
     with the sub-70% "rating said don't trade" zone shaded. Sparse at a small sample by
     design; it's the chart that earns its keep as trades accumulate.
   - **Criterion leaderboard** — average score per rating criterion, weakest first, with each
     criterion's weight. Chronic gaps rank themselves.
   - **Exit ledger** — exit reasons grouped and counted, with the journal's notes quoted
     **verbatim**. The notes are the most valuable text in the dataset; the report shows them
     rather than reducing them to a tally.

**States:** loading → "Loading trades…"; error → message; no closed trades → "the report
fills in as you exit positions".

## Behaviour

- **Colour never carries meaning alone.** Every bar is direct-labelled with its signed value,
  every gate row pairs its colour with an icon and a count, the scatter has a legend.
- Charts are hand-rolled SVG following `modules/equity/components/EquityCurve.tsx` — viewBox +
  scale functions + hover tooltip. **No chart library** is a deliberate constraint.
- Currency comes from Settings — see [settings.spec.md](settings.spec.md).
- Every figure is derived at render. Nothing new is written to `db.json`.

## Module map

```
frontend/src/modules/report/
├── ReportPage.tsx              # composes the two halves
├── index.ts                    # barrel
├── components/
│   ├── SampleBanner.tsx        # honesty note about what n supports
│   ├── PerformanceSection.tsx  # the eight KPI tiles
│   ├── RMultipleChart.tsx      # signed bars + −1R reference line
│   ├── DisciplineTiles.tsx     # traded-against-rating · stop leaks · mistakes
│   ├── GateScorecard.tsx       # non-negotiables, worst first, with leak cost
│   ├── RatingVsOutcomeChart.tsx# rating at entry vs realized R
│   ├── CriterionLeaderboard.tsx# avg score per criterion, weakest first
│   └── MistakeLedger.tsx       # exit reasons + notes verbatim
├── utils/
│   ├── reportTrades.ts         # closed trades + R + rating
│   ├── performanceStats.ts     # expectancy, profit factor, payoff, drawdown, discipline counts
│   ├── gateStats.ts            # aggregate the stored gates
│   ├── criterionStats.ts       # aggregate the stored criteria
│   └── mistakeStats.ts         # group exit learnings by reason
└── types/report.ts
```

Rating vocabulary (`fromRatingSnapshot`, `ratingVerdict`) comes from `modules/place-trade` —
see [place-trade.spec.md](place-trade.spec.md).
