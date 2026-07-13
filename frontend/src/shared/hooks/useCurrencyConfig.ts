import { useSyncExternalStore } from 'react'
import {
  getCurrencyConfig,
  subscribeCurrencyConfig,
  type CurrencyConfig,
} from '../utils/currency'

/** Subscribes to the active currency (see `shared/utils/currency.ts`). The app shell uses
 * this to re-render everything when the choice changes, since `formatCurrency` reads the
 * store directly rather than taking the currency as an argument. */
export function useCurrencyConfig(): CurrencyConfig {
  return useSyncExternalStore(subscribeCurrencyConfig, getCurrencyConfig)
}
