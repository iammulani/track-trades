import type { WatchCategory } from '../types/watchlistItem'
import { CATEGORIES, categoryMeta } from '../utils/categories'
import './CategorySelect.css'

interface CategorySelectProps {
  value: WatchCategory
  onChange: (category: WatchCategory) => void
}

/** The category pill, made interactive — pick a new reason to move the item. */
export function CategorySelect({ value, onChange }: CategorySelectProps) {
  const meta = categoryMeta(value)
  return (
    <select
      className={`cat-select cat-select--${meta.tone}`}
      value={value}
      onChange={(e) => onChange(e.target.value as WatchCategory)}
      aria-label="Change watch category"
    >
      {CATEGORIES.map((c) => (
        <option key={c.value} value={c.value}>
          {c.label}
        </option>
      ))}
    </select>
  )
}
