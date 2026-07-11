# Track Trades — Project Guide

Local-first trade journal. React (Vite + TypeScript) frontend, `json-server` backend.
Everything runs on your machine; libraries are pulled from the internet at install time only.

## Layout

```
track-trades/
├── backend/            # json-server — the database + REST API
│   └── db.json         # the single source of truth (all data lives here)
├── frontend/           # React UI (Vite + TypeScript)
│   └── src/
│       ├── app/        # App shell: router + top-level composition
│       ├── modules/    # feature modules (one folder per feature)
│       └── shared/     # cross-cutting: api client, UI primitives, utils
└── specs/              # feature specs — READ THESE before building a feature
```

## Run

```bash
npm run install:all   # install backend + frontend deps
npm run dev           # runs json-server (:4000) and Vite (:5173) together
```

Frontend calls the API through the `/api` proxy (see `frontend/vite.config.ts`),
which forwards to `http://localhost:4000` — no CORS setup needed.

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

## Spec-driven workflow

Every feature has a spec in `specs/`. To build or change a feature:
**read `specs/<feature>.spec.md` first, then implement to match it.** If the request
conflicts with the spec, update the spec in the same change. See `specs/README.md`.
