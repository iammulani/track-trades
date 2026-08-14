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

/** A fixed cold→hot colour per rating value — not theme-split, same pattern as
 * `shared/utils/avatarColor.ts`. Lets the compact `RatingFlame` control read the
 * exact value from colour alone at a glance, not just from the number. */
export const RATING_TONES: Record<Exclude<WatchRating, 0>, string> = {
  1: '#3b82f6',
  2: '#14b8a6',
  3: '#f59e0b',
  4: '#f97316',
  5: '#ef4444',
}
