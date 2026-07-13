export type WatchCategory = 'active' | 'daily' | 'long-term'
export type WatchSide = 'long' | 'short'

/** Raw watchlist item as stored in db.json. */
export interface WatchlistItem {
  id: string
  symbol: string
  category: WatchCategory
  /** The bias you're watching it for — long or short. */
  side: WatchSide
  /** ISO timestamp of when the symbol was added to the watchlist. */
  watchedSince: string
  notes?: string
  /** Optional external URL — a chart, news article, or writeup for the setup. */
  link?: string
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
  side: WatchSide
  notes?: string
  link?: string
  /** ISO timestamp — lets a symbol be backdated onto the list. Defaults to now if omitted. */
  watchedSince?: string
}
