import { formatWatchedLabel } from '../../watchlist'
import type { ExitedWatchlistItem } from '../types/exitedWatchlistItem'

/** How long it was watched before it was exited — `exitedAt − watchedSince`, not
 * `now − watchedSince` (that would keep growing after the symbol left the list). */
export function watchedDurationLabel(item: Pick<ExitedWatchlistItem, 'watchedSince' | 'exitedAt'>): string {
  const ms = Date.parse(item.exitedAt) - Date.parse(item.watchedSince)
  return formatWatchedLabel(ms)
}
