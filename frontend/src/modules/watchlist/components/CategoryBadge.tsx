import type { WatchCategory } from '../types/watchlistItem'
import { categoryMeta } from '../utils/categories'
import './CategoryBadge.css'

interface CategoryBadgeProps {
  category: WatchCategory
}

/** Category pill. Colour is always paired with the label text. */
export function CategoryBadge({ category }: CategoryBadgeProps) {
  const meta = categoryMeta(category)
  return <span className={`cat-badge cat-badge--${meta.tone}`}>{meta.label}</span>
}
