import type { WatchRating, WatchlistItem } from '../types/watchlistItem'

/** The five rateable values, in fixed order — used by the star control and the filter tabs. */
export const RATING_VALUES: Exclude<WatchRating, 0>[] = [1, 2, 3, 4, 5]

/** The one place "absent means unrated" is decided. */
export function itemRating(item: Pick<WatchlistItem, 'rating'>): WatchRating {
  return item.rating ?? 0
}

/** One click steps the rating forward — unrated → 1 → 2 → 3 → 4 → 5 → back to unrated. */
export function cycleRating(current: WatchRating): WatchRating {
  return current === 5 ? 0 : ((current + 1) as WatchRating)
}
