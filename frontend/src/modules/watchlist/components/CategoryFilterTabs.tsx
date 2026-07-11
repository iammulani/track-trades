import type { WatchCategory } from '../types/watchlistItem'
import { CATEGORIES } from '../utils/categories'
import './CategoryFilterTabs.css'

export type CategoryFilter = WatchCategory | 'all'

interface CategoryFilterTabsProps {
  active: CategoryFilter
  counts: Record<CategoryFilter, number>
  onChange: (filter: CategoryFilter) => void
}

/** Filter the watchlist by why it's being watched. Counts keep the tabs scannable. */
export function CategoryFilterTabs({ active, counts, onChange }: CategoryFilterTabsProps) {
  return (
    <div className="filter-tabs" role="tablist" aria-label="Filter watchlist">
      <button
        type="button"
        role="tab"
        aria-selected={active === 'all'}
        className={`filter-tabs__tab${active === 'all' ? ' is-active' : ''}`}
        onClick={() => onChange('all')}
      >
        All <span className="filter-tabs__count">{counts.all}</span>
      </button>

      {CATEGORIES.map((c) => (
        <button
          key={c.value}
          type="button"
          role="tab"
          aria-selected={active === c.value}
          className={`filter-tabs__tab${active === c.value ? ` is-active filter-tabs__tab--${c.tone}` : ''}`}
          onClick={() => onChange(c.value)}
          title={c.description}
        >
          <span className={`filter-tabs__dot filter-tabs__dot--${c.tone}`} />
          {c.label} <span className="filter-tabs__count">{counts[c.value]}</span>
        </button>
      ))}
    </div>
  )
}
