import { getCurrencyConfig } from './currency'

/** Cross-cutting formatting helpers. No domain knowledge. */

/** Formats in whatever currency is configured under Settings — "₹1,234.50", "$1,234.50".
 * Reads the active choice from `shared/utils/currency.ts` rather than taking it as an
 * argument, so the hundreds of existing call sites don't each have to pass it. */
export function formatCurrency(value: number): string {
  const { currency, locale } = getCurrencyConfig()
  return value.toLocaleString(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/** Signed currency, e.g. "+₹1,234.50" / "-₹980.00". */
export function formatSignedCurrency(value: number): string {
  const sign = value > 0 ? '+' : value < 0 ? '-' : ''
  return `${sign}${formatCurrency(Math.abs(value))}`
}

export function formatPrice(value: number): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/** Signed percent, e.g. "+6.2%" / "-3.7%". */
export function formatSignedPercent(value: number, digits = 1): string {
  const sign = value > 0 ? '+' : value < 0 ? '-' : ''
  return `${sign}${Math.abs(value).toFixed(digits)}%`
}

export function formatPercent(value: number, digits = 1): string {
  return `${value.toFixed(digits)}%`
}

/** Humanised duration from milliseconds, e.g. "4h 35m", "2d 6h", "45m". */
export function formatDuration(ms: number): string {
  if (ms < 0) ms = 0
  const totalMinutes = Math.round(ms / 60000)
  const minutes = totalMinutes % 60
  const totalHours = Math.floor(totalMinutes / 60)
  const hours = totalHours % 24
  const days = Math.floor(totalHours / 24)

  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

/** Compact datetime, e.g. "Jun 2, 09:35". */
export function formatDateTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}
