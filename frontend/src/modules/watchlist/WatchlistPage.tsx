import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AddTickerForm } from './components/AddTickerForm'
import { CategoryFilterTabs, type CategoryFilter } from './components/CategoryFilterTabs'
import { WatchlistTable } from './components/WatchlistTable'
import { useWatchlist } from './hooks/useWatchlist'
import type { NewWatchlistItem } from './types/watchlistItem'
import { CATEGORIES } from './utils/categories'
import './WatchlistPage.css'

const VALID_FILTERS: CategoryFilter[] = ['all', ...CATEGORIES.map((c) => c.value)]

export function WatchlistPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { items, loading, error, adding, addItem, removeItem, updateCategory } = useWatchlist()

  const filterParam = searchParams.get('category')
  const filter: CategoryFilter = VALID_FILTERS.includes(filterParam as CategoryFilter)
    ? (filterParam as CategoryFilter)
    : 'all'

  const counts = useMemo(() => {
    const base: Record<CategoryFilter, number> = {
      all: items.length,
      active: 0,
      daily: 0,
      'long-term': 0,
    }
    for (const item of items) base[item.category] += 1
    return base
  }, [items])

  const filtered = useMemo(
    () => (filter === 'all' ? items : items.filter((item) => item.category === filter)),
    [items, filter],
  )

  function handleFilterChange(next: CategoryFilter) {
    if (next === 'all') {
      setSearchParams({})
    } else {
      setSearchParams({ category: next })
    }
  }

  // Always land back on "All" after adding — otherwise adding a symbol whose
  // category doesn't match the current filter looks like nothing happened.
  async function handleAdd(input: NewWatchlistItem) {
    await addItem(input)
    setSearchParams({})
  }

  return (
    <section className="watchlist-page">
      <header className="watchlist-page__header">
        <h1 className="watchlist-page__title">Watchlist</h1>
        <p className="watchlist-page__subtitle">
          Track symbols you're keeping an eye on, and how long you've been watching them.
        </p>
      </header>

      <AddTickerForm
        adding={adding}
        onAdd={handleAdd}
        defaultCategory={filter === 'all' ? undefined : filter}
      />

      {loading && <p className="watchlist-page__state">Loading watchlist…</p>}

      {error && (
        <p className="watchlist-page__state watchlist-page__state--error">
          Couldn’t load the watchlist: {error}. Is the backend running on port 4000?
        </p>
      )}

      {!loading && !error && (
        <>
          <CategoryFilterTabs active={filter} counts={counts} onChange={handleFilterChange} />

          {items.length === 0 ? (
            <p className="watchlist-page__state">
              Nothing on your watchlist yet — add a ticker above to get started.
            </p>
          ) : filtered.length === 0 ? (
            <p className="watchlist-page__state">No symbols in this category yet.</p>
          ) : (
            <WatchlistTable
              items={filtered}
              onRemove={removeItem}
              onUpdateCategory={updateCategory}
            />
          )}
        </>
      )}
    </section>
  )
}
