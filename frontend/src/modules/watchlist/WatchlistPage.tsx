import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Icon } from '../../shared/components/Icon'
import { AddTickerModal } from './components/AddTickerModal'
import { CategoryFilterTabs, type CategoryFilter } from './components/CategoryFilterTabs'
import { TickerSearch } from './components/TickerSearch'
import { WatchlistTable } from './components/WatchlistTable'
import { useWatchlist } from './hooks/useWatchlist'
import type { NewWatchlistItem } from './types/watchlistItem'
import { CATEGORIES } from './utils/categories'
import './WatchlistPage.css'

const VALID_FILTERS: CategoryFilter[] = ['all', ...CATEGORIES.map((c) => c.value)]

export function WatchlistPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
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

  const byCategory = useMemo(
    () => (filter === 'all' ? items : items.filter((item) => item.category === filter)),
    [items, filter],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toUpperCase()
    if (!q) return byCategory
    return byCategory.filter((item) => item.symbol.includes(q))
  }, [byCategory, search])

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
        <div>
          <h1 className="watchlist-page__title">Watchlist</h1>
          <p className="watchlist-page__subtitle">
            Track symbols you're keeping an eye on, and how long you've been watching them.
          </p>
        </div>
        <button
          type="button"
          className="watchlist-page__add-trigger"
          onClick={() => setModalOpen(true)}
        >
          <Icon name="plus" size={16} />
          Add
        </button>
      </header>

      {loading && <p className="watchlist-page__state">Loading watchlist…</p>}

      {error && (
        <p className="watchlist-page__state watchlist-page__state--error">
          Couldn’t load the watchlist: {error}. Is the backend running on port 4000?
        </p>
      )}

      {!loading && !error && (
        <>
          <div className="watchlist-page__toolbar">
            <TickerSearch value={search} onChange={setSearch} />
            <CategoryFilterTabs active={filter} counts={counts} onChange={handleFilterChange} />
          </div>

          {items.length === 0 ? (
            <p className="watchlist-page__state">
              Nothing on your watchlist yet — click Add above to get started.
            </p>
          ) : filtered.length === 0 ? (
            <p className="watchlist-page__state">
              {search.trim()
                ? `No tickers match "${search.trim()}".`
                : 'No symbols in this category yet.'}
            </p>
          ) : (
            <WatchlistTable
              items={filtered}
              onRemove={removeItem}
              onUpdateCategory={updateCategory}
            />
          )}
        </>
      )}

      <AddTickerModal
        open={modalOpen}
        items={items}
        adding={adding}
        defaultCategory={filter === 'all' ? undefined : filter}
        onAdd={handleAdd}
        onClose={() => setModalOpen(false)}
      />
    </section>
  )
}
