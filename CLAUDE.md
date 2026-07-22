# Track Trades — Project Guide

Local-first trade journal. React (Vite + TypeScript) frontend, `json-server` backend.
Everything runs on your machine; libraries are pulled from the internet at install time only.

## Layout

```
track-trades/
├── backend/
│   ├── data/            # source of truth — one JSON file per resource
│   │   └── trades.json  # -> becomes the "trades" endpoint
│   ├── merge-db.js      # keeps data/*.json <-> db.json in sync, both directions
│   ├── db.json          # what json-server actually serves; gitignored
│   └── stock-scanner/   # hand-run CLI: TradingView export -> reviewable checklist.csv
├── frontend/            # React UI (Vite + TypeScript)
│   └── src/
│       ├── app/         # App shell: router + top-level composition
│       ├── modules/     # feature modules (one folder per feature)
│       └── shared/      # cross-cutting: api client, UI primitives, utils
├── specs/               # feature specs — READ THESE before building a feature
└── .claude/hooks/       # spec-reminder.mjs — surfaces the right spec on every edit
```

## Run

```bash
npm run install:all   # install backend + frontend deps
npm run dev           # syncs backend/data <-> db.json (watching both), runs
                       # json-server (:4000) and Vite (:5173) together
```

Frontend calls the API through the `/api` proxy (see `frontend/vite.config.ts`),
which forwards to `http://localhost:4000` — no CORS setup needed.

**Anything added/edited/removed through the app — a trade, a watchlist item —
gets written back to `backend/data/*.json` automatically** while `npm run dev`
is running (json-server writes `db.json`; `merge-db.js` mirrors that back out
to the per-resource file). **Commit `backend/data/*.json` whenever you want to
save a snapshot of your data** — `db.json` itself is gitignored, so you never
commit that file directly.

**Adding a resource:** drop a new file in `backend/data/` (e.g. `tags.json`, holding
either an array or object) — `merge-db.js` picks it up automatically and it becomes
`/tags` on next sync. Never hand-edit `backend/db.json`; it's derived from `data/`
and kept in sync automatically. To force a hard reset back to the committed
`data/*.json` (discarding anything only reflected in a stale `db.json`), run
`npm run reset:db --prefix backend`.

## Conventions (non-negotiable — keeps modules easy to edit)

1. **Feature = one folder under `src/modules/`.** Never scatter a feature's files.
2. **Small files, one responsibility each.** A component renders; a hook fetches/derives;
   a util calculates; a type describes. Do not mix these in one file.
3. **Standard module shape** (create only the folders a feature needs):
   ```
   modules/<feature>/
   ├── <Feature>Page.tsx   # the page entry, composes components
   ├── components/         # presentational pieces (props in, JSX out)
   ├── hooks/              # data fetching + state (use…)
   ├── api/                # feature API calls (wrap shared apiClient)
   ├── utils/              # pure calculations / derivations
   ├── types/              # TypeScript types for the feature
   └── index.ts            # barrel: the module's public exports
   ```
4. **Derive, don't store.** Anything computable (P&L, win rate, duration) is derived
   in a `utils/` function from the raw JSON — never persisted in `db.json`.
5. **Shared before bespoke.** Reusable UI (Card, Badge, StatTile) and formatting live
   in `src/shared/` and are imported by modules — never copy-pasted.
6. **Import a module only through its `index.ts` barrel** from outside the module.
7. **Domain-only modules skip the `Page.tsx`.** A module can exist purely as a shared
   data layer for other feature modules (e.g. `modules/trades`) — no page, no route,
   just `types/` + `api/` + `hooks/` + `utils/` behind its barrel.

## Spec-driven workflow

Every feature has a spec in `specs/`. To build or change a feature:
**read `specs/<feature>.spec.md` first, then implement to match it.** If the request
conflicts with the spec, update the spec in the same change. See `specs/README.md`.
