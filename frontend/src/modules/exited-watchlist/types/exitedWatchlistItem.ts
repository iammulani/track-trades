import type { QuarterFinancials } from '../../fundamentals'
import type { WatchCategory, WatchNote, WatchRating, WatchSide } from '../../watchlist'

/** The raw quarterly figures captured for the item, if Verify Fundamental was ever opened —
 * carried over as-is, the same "derive don't store" rule as the live record: Code 33 is
 * recomputed from these on every render (via `computeCode33`), never persisted as a score. */
export interface ExitedFundamentals {
  asOfPeriod: string
  quarterCount: number
  quarters: QuarterFinancials[]
}

export type ExitReason =
  | 'fundamentals-poor'
  | 'peer-comparison-failed'
  | 'vcp-failed'
  | 'no-follow-through'
  | 'broke-key-support'
  | 'stage-2-broken'
  | 'thesis-invalidated'
  | 'too-extended'
  | 'better-setup-elsewhere'
  | 'sector-rotated-out'
  | 'low-liquidity'
  | 'lost-interest'
  | 'other'

/** A watchlist item's full record at the moment it was exited — carried over as-is,
 * plus why and when. Never deduped: the same symbol can be archived under this
 * several times over its life, once per stint on the watchlist. */
export interface ExitedWatchlistItem {
  id: string
  symbol: string
  category: WatchCategory
  side: WatchSide
  watchedSince: string
  notes?: WatchNote[] | string
  link?: string
  rating?: WatchRating
  /** The fundamentals record captured against the item, if any — absent if Verify
   * Fundamental was never opened for it. */
  fundamentals?: ExitedFundamentals
  exitReason: ExitReason
  exitNote?: string
  /** ISO timestamp — when it was exited. */
  exitedAt: string
  /** Traceability only — the watchlist item this was archived from. Never used for
   * dedup/uniqueness; a symbol may be archived under this several times over its life. */
  sourceWatchlistId: string
}

export type NewExitedWatchlistItem = Omit<ExitedWatchlistItem, 'id'>
