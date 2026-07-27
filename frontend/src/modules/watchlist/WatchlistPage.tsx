import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Icon } from '../../shared/components/Icon'
import { PageHeader } from '../../shared/components/PageHeader'
import { useDrafts } from '../drafts'
import { AddTickerModal } from './components/AddTickerModal'
import { CategoryFilterTabs, type CategoryFilter } from './components/CategoryFilterTabs'
import { RatingFilterTabs, type RatingFilter } from './components/RatingFilterTabs'
import { TickerSearch } from './components/TickerSearch'
import { WatchlistTable } from './components/WatchlistTable'
import { useWatchlist } from './hooks/useWatchlist'
import type { NewWatchlistItem } from './types/watchlistItem'
import { CATEGORIES } from './utils/categories'
import { itemRating, RATING_VALUES } from './utils/ratings'
import './WatchlistPage.css'

const VALID_FILTERS: CategoryFilter[] = ['all', ...CATEGORIES.map((c) => c.value)]

/** `?rating=` accepts "any", "unrated", or "1".."5" — anything else falls back to "any". */
function parseRatingParam(raw: string | null): RatingFilter {
  if (raw === 'unrated') return 'unrated'
  const n = Number(raw)
  return RATING_VALUES.includes(n as (typeof RATING_VALUES)[number]) ? (n as RatingFilter) : 'any'
}

export function WatchlistPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const { items, loading, error, adding, addItem, removeItem, updateCategory, updateRating } =
    useWatchlist()
  const { byWatchlistId: draftsByItem, discard: discardDraft } = useDrafts()

  const filterParam = searchParams.get('category')
  const filter: CategoryFilter = VALID_FILTERS.includes(filterParam as CategoryFilter)
    ? (filterParam as CategoryFilter)
    : 'all'
  const ratingFilter = parseRatingParam(searchParams.get('rating'))

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

  const ratingCounts = useMemo(() => {
    const base: Record<RatingFilter, number> = {
      any: items.length,
      unrated: 0,
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    }
    for (const item of items) {
      const rating = itemRating(item)
      if (rating === 0) base.unrated += 1
      else base[rating] += 1
    }
    return base
  }, [items])

  const byCategory = useMemo(
    () => (filter === 'all' ? items : items.filter((item) => item.category === filter)),
    [items, filter],
  )

  const byRating = useMemo(() => {
    if (ratingFilter === 'any') return byCategory
    if (ratingFilter === 'unrated') return byCategory.filter((item) => itemRating(item) === 0)
    return byCategory.filter((item) => itemRating(item) === ratingFilter)
  }, [byCategory, ratingFilter])

  const filtered = useMemo(() => {
    const q = search.trim().toUpperCase()
    if (!q) return byRating
    return byRating.filter((item) => item.symbol.includes(q))
  }, [byRating, search])

  /** Both filters live in the URL and must survive each other — always write the pair,
   * dropping whichever is at its default so a plain view keeps a clean URL. */
  function applyFilters(nextCategory: CategoryFilter, nextRating: RatingFilter) {
    const params: Record<string, string> = {}
    if (nextCategory !== 'all') params.category = nextCategory
    if (nextRating !== 'any') params.rating = String(nextRating)
    setSearchParams(params)
  }

  // Always land back on "All"/"Any rating" after adding — otherwise a symbol whose
  // category doesn't match the current filter (or a new, unrated one seen through a
  // star filter) looks like the add silently failed.
  async function handleAdd(input: NewWatchlistItem) {
    await addItem(input)
    setSearchParams({})
  }

  // Drop the parked stepper run along with the symbol — a draft with no watchlist item
  // behind it can never be resumed.
  async function handleRemove(id: string) {
    await removeItem(id)
    await discardDraft(id)
  }

  return (
    <section className="watchlist-page">
      <PageHeader
        icon="eye"
        title="Watchlist"
        subtitle="Track symbols you're keeping an eye on, and how long you've been watching them."
      />

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
            <CategoryFilterTabs
              active={filter}
              counts={counts}
              onChange={(next) => applyFilters(next, ratingFilter)}
            />
            <button
              type="button"
              className="watchlist-page__add-trigger"
              onClick={() => setModalOpen(true)}
            >
              <Icon name="plus" size={16} />
              Add
            </button>
          </div>

          <div className="watchlist-page__toolbar watchlist-page__toolbar--secondary">
            <RatingFilterTabs
              active={ratingFilter}
              counts={ratingCounts}
              onChange={(next) => applyFilters(filter, next)}
            />
          </div>

          {items.length === 0 ? (
            <p className="watchlist-page__state">
              Nothing on your watchlist yet — click Add above to get started.
            </p>
          ) : filtered.length === 0 ? (
            <p className="watchlist-page__state">
              {search.trim()
                ? `No tickers match "${search.trim()}".`
                : filter === 'all' && ratingFilter !== 'any'
                  ? ratingFilter === 'unrated'
                    ? 'Everything on your watchlist is rated.'
                    : 'No symbols with this rating yet.'
                  : 'No symbols in this category yet.'}
            </p>
          ) : (
            <WatchlistTable
              items={filtered}
              drafts={draftsByItem}
              onRemove={handleRemove}
              onUpdateCategory={updateCategory}
              onUpdateRating={updateRating}
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
