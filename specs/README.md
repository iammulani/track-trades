# Specs

This project uses **spec-driven development**: the behaviour of each feature is
described in a spec file _before_ it's coded, and the code is kept in sync with it.
The goal — you (or an AI assistant) can build or change a feature by pointing at its
spec instead of re-explaining requirements every time.

## How to use these

- **Building a feature:** read `specs/<feature>.spec.md`, then implement it following
  the module conventions in [`../CLAUDE.md`](../CLAUDE.md).
- **Changing a feature:** edit the spec first (or in the same commit), so the spec is
  always the current source of truth. Code that drifts from its spec is a bug.
- **New feature:** copy the template below into `specs/<feature>.spec.md`, fill it in,
  then build.

## Spec template

```markdown
# <Feature> — Spec

## Purpose

One or two sentences: what this feature is for and who uses it.

## Data

- Source: which `db.json` resource(s) / API endpoint(s).
- Shape: the raw fields consumed (link to the `types/` file once it exists).
- Derived: values computed from the raw data (and the formula for each).

## UI

- Layout: the sections/regions, top to bottom.
- Components: each component, its job, and its key props.
- States: loading / empty / error / populated.

## Behaviour

- Interactions, sorting, filtering, formatting rules.

## Module map

The files this feature owns under `modules/<feature>/`.
```

## Index

| Feature       | Spec                                   | Module                           |
| ------------- | -------------------------------------- | -------------------------------- |
| Trades domain | [trades.spec.md](trades.spec.md)       | `frontend/src/modules/trades`    |
| Dashboard     | [dashboard.spec.md](dashboard.spec.md) | `frontend/src/modules/dashboard` |
| Equity Curve  | [equity.spec.md](equity.spec.md)       | `frontend/src/modules/equity`    |
| Watchlist     | [watchlist.spec.md](watchlist.spec.md) | `frontend/src/modules/watchlist` |
