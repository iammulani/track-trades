import { Icon } from '../../../shared/components/Icon'
import type { WatchRating } from '../types/watchlistItem'
import { RATING_VALUES } from '../utils/ratings'
import './CategoryFilterTabs.css'
import './RatingFilterTabs.css'

export type RatingFilter = 'any' | 'unrated' | Exclude<WatchRating, 0>

interface RatingFilterTabsProps {
  active: RatingFilter
  counts: Record<RatingFilter, number>
  onChange: (filter: RatingFilter) => void
}

/** Filter the watchlist by its manual star rating — the shortlist of best setups.
 * Reuses the category tabs' pill styling so the two filter rows read as one control. */
export function RatingFilterTabs({ active, counts, onChange }: RatingFilterTabsProps) {
  return (
    <div className="filter-tabs" role="tablist" aria-label="Filter watchlist by rating">
      <button
        type="button"
        role="tab"
        aria-selected={active === 'any'}
        className={`filter-tabs__tab${active === 'any' ? ' is-active' : ''}`}
        onClick={() => onChange('any')}
      >
        Any rating <span className="filter-tabs__count">{counts.any}</span>
      </button>

      {RATING_VALUES.map((n) => (
        <button
          key={n}
          type="button"
          role="tab"
          aria-selected={active === n}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
          className={`filter-tabs__tab${active === n ? ' is-active' : ''}`}
          onClick={() => onChange(n)}
          title={`Rated ${n} star${n > 1 ? 's' : ''}`}
        >
          <Icon name="star" size={13} className="rating-tabs__star" />
          {n} <span className="filter-tabs__count">{counts[n]}</span>
        </button>
      ))}

      <button
        type="button"
        role="tab"
        aria-selected={active === 'unrated'}
        className={`filter-tabs__tab${active === 'unrated' ? ' is-active' : ''}`}
        onClick={() => onChange('unrated')}
        title="Not rated yet"
      >
        Unrated <span className="filter-tabs__count">{counts.unrated}</span>
      </button>
    </div>
  )
}
