export type WatchCategory = 'active' | 'daily' | 'long-term'

/** Raw watchlist item as stored in db.json. */
export interface WatchlistItem {
  id: string
  symbol: string
  category: WatchCategory
  /** ISO timestamp of when the symbol was added to the watchlist. */
  watchedSince: string
  notes?: string
}

/** A watchlist item paired with how long it's been watched. */
export interface WatchlistItemWithMetrics extends WatchlistItem {
  /** Milliseconds between watchedSince and now. */
  watchedMs: number
  /** Humanised label, e.g. "Today", "5 days", "2 months". */
  watchedLabel: string
}

export interface NewWatchlistItem {
  symbol: string
  category: WatchCategory
}
