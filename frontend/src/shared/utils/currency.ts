/**
 * The currency every amount in the app is formatted in.
 *
 * It lives in `shared/` rather than in `modules/settings/` on purpose: `formatCurrency`
 * is a pure, synchronous function called from every module, and threading the active
 * currency through as a prop or a hook at each of those call sites would be worse than
 * a small module-level store. `shared` cannot import from `modules`, so the dependency
 * only points one way — the settings module owns *loading and persisting* the choice and
 * pushes it in here; everything else just reads it.
 *
 * The store is `useSyncExternalStore`-shaped so the app shell can re-render on a change
 * (see `shared/hooks/useCurrencyConfig.ts`).
 */
export interface CurrencyConfig {
  /** ISO 4217 code, e.g. "INR" — what `Intl.NumberFormat` formats as. */
  currency: string
  /** BCP 47 locale, e.g. "en-IN" — decides digit grouping (₹1,00,000 vs $100,000). */
  locale: string
}

/** What the app formats in before `/settings` has loaded, and if it can't be reached. */
export const DEFAULT_CURRENCY: CurrencyConfig = { currency: 'INR', locale: 'en-IN' }

let active: CurrencyConfig = DEFAULT_CURRENCY
const listeners = new Set<() => void>()

export function getCurrencyConfig(): CurrencyConfig {
  return active
}

export function setCurrencyConfig(next: CurrencyConfig): void {
  if (next.currency === active.currency && next.locale === active.locale) return
  active = next
  for (const listener of listeners) listener()
}

export function subscribeCurrencyConfig(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
