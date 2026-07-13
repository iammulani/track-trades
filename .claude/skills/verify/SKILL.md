---
name: verify
description: Launch Track Trades and drive it in a browser to observe a change actually working. Use when verifying any frontend/backend change end-to-end.
---

# Verifying Track Trades

Browser app (Vite + React on :5173, json-server on :4000). The surface is **pixels** —
drive it with Playwright, don't import-and-call the utils.

## Typecheck: use the app config, NOT the root one

```bash
npx tsc -p frontend/tsconfig.app.json --noEmit   # ✅ actually checks src/
npx tsc --noEmit                                 # ❌ VACUOUS — root tsconfig is {"files": []}
```

The root `tsconfig.json` is references-only, so a bare `tsc --noEmit` **passes on
broken code**. It silently missed a real `Property 'rsi' does not exist` bug once.
`src/shared/components/HoverCard.tsx` has ~3 pre-existing errors — ignore those.

## Launch

```bash
lsof -ti:4000 -ti:5173 | xargs kill -9   # a dev server is often already running
npm run dev > /tmp/dev.log 2>&1 &        # sleep ~14s; backend + frontend together
curl -s http://localhost:4000/trades     # API up? merge-db has synced data/*.json -> db.json
```

Editing `backend/data/*.json` while `npm run dev` runs auto-syncs into `db.json` —
no restart needed.

## Drive

Playwright is cached but the npm package may not be installed; from a scratch dir:
`npm init -y && npm i playwright && npx playwright install chromium`.

Useful routes and selectors:

| what | how |
|---|---|
| Trade Detail | `/trades/:id` — ids from `curl :4000/trades` |
| Place-trade stepper | `/watchlist` → click "Place Trade" on a row |
| Rating stars | `.rating-stars__track .rating-stars__star` (5 of them); fill % is the `--fill` CSS var on `.rating-stars` |
| Rating score / verdict | `.trade-detail__rating-score` / `-verdict`, `.review-step__rating-score` / `-verdict`; stepper badge `.trade-rating-badge__count` |
| Failed-gate banner | `.rating-gate-banner`, labels `.rating-gate-banner__label` |
| Points breakdown | `.trade-detail__breakdown-row` / `.review-step__breakdown-row` |

**Gotchas that cost time:**
- Checklist items are `<button>`, **not** `<input type=checkbox>` — `.check()` silently
  does nothing. Click `.checklist-step button`.
- Stage/Base options have `role="radio"` — use `getByRole('radio', { name: /^Stage 2/ })`.
  A bare `text=Stage 2` also matches the rating hover-card's gate list and hangs.
- The stepper is 7 steps; `Next` is disabled until required fields are filled
  (setup: entry+qty+date; stage&base: both; 52-week: low+high).

## Worth driving for a rating change

Fill the stepper with a clean Stage-2 setup (entry 100, qty 10, stop 91, target 130;
Stage 2 + Base 1; all 3 MA checks; RS 85; 50-day MA 98; 52wk 60/105; 8 weeks in base;
contractions 100→80 and 100→92) → should read **5.0 / 5 "Excellent setup"**, no banner.
Then go Back and move the stop to 93 — *inside* the last contraction (low 92) — and it
should collapse to **3.0 / 5 "Marginal"**, R:R 0/2, with the stop gate's red banner.
That single-variable swing is the whole point of the gated rating.
