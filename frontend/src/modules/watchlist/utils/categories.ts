import type { IconName } from '../../../shared/components/Icon'
import type { WatchCategory } from '../types/watchlistItem'

export interface CategoryMeta {
  value: WatchCategory
  label: string
  description: string
  /** Matches the tone slots used by shared StatTile-style chips. */
  tone: 'amber' | 'accent' | 'violet'
  /** Stands in for the label in compact spots (the table's Reason chip) where full text doesn't fit. */
  icon: IconName
}

/** Fixed order — used for filter tabs, badges, and the add form. Never reordered by data. */
export const CATEGORIES: CategoryMeta[] = [
  {
    value: 'active',
    label: 'Actively Watching',
    description: 'Near the trading area — could trigger soon',
    tone: 'amber',
    icon: 'target',
  },
  {
    value: 'daily',
    label: 'Watch Daily',
    description: 'Check in daily — may set up for a trade',
    tone: 'accent',
    icon: 'clock',
  },
  {
    value: 'long-term',
    label: 'Long-Term Setup',
    description: 'Looks good, but wants a better entry',
    tone: 'violet',
    icon: 'trending',
  },
]

export function categoryMeta(category: WatchCategory): CategoryMeta {
  return CATEGORIES.find((c) => c.value === category) as CategoryMeta
}
