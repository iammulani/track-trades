import { Icon } from '../../../shared/components/Icon'
import type { WatchCategory } from '../types/watchlistItem'
import { CATEGORIES, categoryMeta } from '../utils/categories'
import './CategorySelect.css'

interface CategorySelectProps {
  value: WatchCategory
  onChange: (category: WatchCategory) => void
}

/**
 * The category chip, made interactive — pick a new reason to move the item.
 * Shows just the category's icon so the column stays narrow; the full name is
 * a click away in the native dropdown (and a hover title), never lost, just
 * not spelled out in every row.
 */
export function CategorySelect({ value, onChange }: CategorySelectProps) {
  const meta = categoryMeta(value)
  return (
    <div className={`cat-select cat-select--${meta.tone}`} title={meta.label}>
      <Icon name={meta.icon} size={14} />
      <select
        className="cat-select__native"
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
    </div>
  )
}
