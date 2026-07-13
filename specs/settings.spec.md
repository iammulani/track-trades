# Settings — Spec

## Purpose

Preferences for the journal. Today that's one thing: **the currency every amount in the app
is formatted in**, so the journal isn't hardcoded to whichever market its author happened to
trade.

## Data

- **Source:** `backend/data/settings.json` → the `/settings` endpoint.
- **Singular resource, not a collection.** The file holds an object rather than an array, and
  json-server serves that as a singular resource: `GET /settings` and `PATCH /settings`, with
  no id in the path and no list to index into.
- **Shape:**
  ```json
  { "currency": "INR", "locale": "en-IN" }
  ```
  - `currency` — ISO 4217 code; what `Intl.NumberFormat` formats as.
  - `locale` — BCP 47 tag; what decides **digit grouping**. This is why the two are stored
    together and never picked apart: INR wants `en-IN` (₹1,23,456.78, lakh grouping), not
    `en-US` (₹123,456.78). The picker offers currencies; the correct locale rides along with
    the choice (`CURRENCY_OPTIONS`).
- Saved through the app's normal write-back flow — json-server writes `db.json`, `merge-db.js`
  mirrors it back to `backend/data/settings.json`, which is what gets committed.

## How the currency reaches the rest of the app

`formatCurrency` is a pure, synchronous function called from every module. Threading the
active currency through as a prop or a hook at each of those call sites would be far worse
than a small module-level store, so:

- **`shared/utils/currency.ts`** holds the active `CurrencyConfig` plus a
  `useSyncExternalStore`-shaped subscribe/get/set. It lives in `shared/` (not in
  `modules/settings/`) because `shared` cannot import from `modules` — the dependency points
  one way. The settings module owns *loading and persisting* the choice and pushes it in here;
  everything else only reads it.
- **`formatCurrency`** reads that store. No call site changes.
- **`app/App.tsx`** calls `useSettings()` once at boot to apply the saved currency **before
  the first paint of any amount**, and keys `RouterProvider` on the active currency — since
  the value doesn't flow through React, a key change is what re-renders the tree when it
  changes. Heavy-handed, and exactly right for something that changes once in a blue moon and
  touches every rendered amount when it does.
- If `/settings` can't be reached the app still runs; formatting falls back to
  `DEFAULT_CURRENCY`.

## UI

- **Header** (`shared/PageHeader`, icon `settings`) — subtitle names the file the choice is
  saved to, because that file is the thing the user commits.
- **Currency card** — a labelled `<select>` of `CURRENCY_OPTIONS` (symbol · name · code)
  beside a **live preview** of a large amount, so the effect on digit grouping is visible
  before committing to it. Changing the select saves immediately (no Save button — one field,
  instantly reversible); the select is disabled while saving.
- **States:** loading → "Loading settings…"; error → message.

## Behaviour

- Selecting a currency `PATCH`es `{ currency, locale }` together and republishes to the shared
  store, so every open page reformats.
- Adding a currency is one row in `CURRENCY_OPTIONS` — nothing else changes.

## Module map

```
frontend/src/modules/settings/
├── SettingsPage.tsx            # the page
├── index.ts                    # barrel
├── components/CurrencyField.tsx# picker + live preview
├── hooks/useSettings.ts        # load, save, publish into the shared currency store
├── api/settingsApi.ts          # GET/PATCH the singular /settings resource
├── utils/currencyOptions.ts    # the offered currencies + their locales
└── types/settings.ts

frontend/src/shared/
├── utils/currency.ts           # the active-currency store (read by formatCurrency)
├── hooks/useCurrencyConfig.ts  # subscribe to it
└── utils/format.ts             # formatCurrency reads the store
```
