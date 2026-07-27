import type { WatchRating, WatchlistItem } from '../types/watchlistItem'

/** The five rateable values, in fixed order — used by the star control and the filter tabs. */
export const RATING_VALUES: Exclude<WatchRating, 0>[] = [1, 2, 3, 4, 5]

/** The one place "absent means unrated" is decided. */
export function itemRating(item: Pick<WatchlistItem, 'rating'>): WatchRating {
  return item.rating ?? 0
}

/** Clicking the star you're already on clears the rating — otherwise the clicked star wins. */
export function nextRating(current: WatchRating, clicked: Exclude<WatchRating, 0>): WatchRating {
  return current === clicked ? 0 : clicked
}
