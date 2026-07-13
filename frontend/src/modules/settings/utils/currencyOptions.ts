import type { CurrencyConfig } from '../../../shared/utils/currency'

export interface CurrencyOption extends CurrencyConfig {
  /** What the picker shows, e.g. "Indian Rupee". */
  label: string
  /** The symbol, for the inline preview — not used for formatting itself. */
  symbol: string
}

/** The currencies offered in Settings. Each carries the locale that formats it the way
 * its users expect — the locale is what decides digit grouping, so INR has to be `en-IN`
 * (₹1,00,000, lakh grouping) rather than `en-US` (₹100,000). Add a row to offer another. */
export const CURRENCY_OPTIONS: CurrencyOption[] = [
  { currency: 'INR', locale: 'en-IN', label: 'Indian Rupee', symbol: '₹' },
  { currency: 'USD', locale: 'en-US', label: 'US Dollar', symbol: '$' },
  { currency: 'EUR', locale: 'de-DE', label: 'Euro', symbol: '€' },
  { currency: 'GBP', locale: 'en-GB', label: 'British Pound', symbol: '£' },
  { currency: 'JPY', locale: 'ja-JP', label: 'Japanese Yen', symbol: '¥' },
  { currency: 'AUD', locale: 'en-AU', label: 'Australian Dollar', symbol: 'A$' },
  { currency: 'CAD', locale: 'en-CA', label: 'Canadian Dollar', symbol: 'C$' },
  { currency: 'SGD', locale: 'en-SG', label: 'Singapore Dollar', symbol: 'S$' },
  { currency: 'AED', locale: 'en-AE', label: 'UAE Dirham', symbol: 'د.إ' },
  { currency: 'CHF', locale: 'de-CH', label: 'Swiss Franc', symbol: 'CHF' },
]

export function findCurrencyOption(currency: string): CurrencyOption | undefined {
  return CURRENCY_OPTIONS.find((o) => o.currency === currency)
}
