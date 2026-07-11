import type { WatchlistItem, WatchlistItemWithMetrics } from '../types/watchlistItem'

const DAY_MS = 24 * 60 * 60 * 1000

/** Humanised "how long has this been watched" label. */
export function formatWatchedLabel(ms: number): string {
  const days = Math.floor(ms / DAY_MS)

  if (days <= 0) return 'Today'
  if (days === 1) return '1 day'
  if (days < 30) return `${days} days`

  const months = Math.floor(days / 30)
  if (months < 12) return `${months} month${months > 1 ? 's' : ''}`

  const years = Math.floor(days / 365)
  return `${years} year${years > 1 ? 's' : ''}`
}

export function withWatchMetrics(item: WatchlistItem): WatchlistItemWithMetrics {
  const watchedMs = Date.now() - new Date(item.watchedSince).getTime()
  return { ...item, watchedMs, watchedLabel: formatWatchedLabel(watchedMs) }
}

/** Newest-added first. */
export function sortByWatchedDesc(items: WatchlistItemWithMetrics[]): WatchlistItemWithMetrics[] {
  return [...items].sort(
    (a, b) => new Date(b.watchedSince).getTime() - new Date(a.watchedSince).getTime(),
  )
}
