export type WatchCategory = 'active' | 'daily' | 'long-term'
export type WatchSide = 'long' | 'short'
/** Manual quality rating, 1–5 stars. `0` or absent means unrated. */
export type WatchRating = 0 | 1 | 2 | 3 | 4 | 5

/** One dated journal entry against a watched symbol. */
export interface WatchNote {
  id: string
  /** What happened — the fact, event or price action being recorded. */
  text: string
  /** Optional — what you read into it. Kept separate from `text` so the record of
   * what happened stays clean of the judgement you made at the time. */
  conclusion?: string
  /** ISO timestamp — the day the observation belongs to. Backdatable; defaults to today. */
  date: string
  /** ISO timestamp — set only once the text is changed after it was first saved. */
  editedAt?: string
}

/** Raw watchlist item as stored in db.json. */
export interface WatchlistItem {
  id: string
  symbol: string
  category: WatchCategory
  /** The bias you're watching it for — long or short. */
  side: WatchSide
  /** ISO timestamp of when the symbol was added to the watchlist. */
  watchedSince: string
  /** Dated journal entries, newest first. Absent on items never noted; older rows may
   * still hold the legacy single string — read them through `itemNotes()`. */
  notes?: WatchNote[] | string
  /** Optional external URL — a chart, news article, or writeup for the setup. */
  link?: string
  /** Manual 1–5 star rating, set inline on the list. Absent on items never rated. */
  rating?: WatchRating
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
  /** Opening note — becomes the item's first journal entry, dated `watchedSince`. */
  notes?: string
  link?: string
  /** ISO timestamp — lets a symbol be backdated onto the list. Defaults to now if omitted. */
  watchedSince?: string
}
