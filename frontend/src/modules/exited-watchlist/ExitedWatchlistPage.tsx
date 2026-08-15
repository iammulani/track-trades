import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PageHeader } from '../../shared/components/PageHeader'
import { TickerSearch } from '../../shared/components/TickerSearch'
import { ExitedWatchlistTable } from './components/ExitedWatchlistTable'
import { ReasonFilterSelect, type ReasonFilter } from './components/ReasonFilterSelect'
import { useExitedWatchlist } from './hooks/useExitedWatchlist'
import { EXIT_REASONS } from './utils/exitReasons'
import './ExitedWatchlistPage.css'

const VALID_FILTERS: ReasonFilter[] = ['all', ...EXIT_REASONS.map((r) => r.value)]

export function ExitedWatchlistPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const { items, loading, error, removeItem } = useExitedWatchlist()

  const filterParam = searchParams.get('reason')
  const filter: ReasonFilter = VALID_FILTERS.includes(filterParam as ReasonFilter)
    ? (filterParam as ReasonFilter)
    : 'all'

  const counts = useMemo(() => {
    const base = { all: items.length } as Record<ReasonFilter, number>
    for (const r of EXIT_REASONS) base[r.value] = 0
    for (const item of items) base[item.exitReason] += 1
    return base
  }, [items])

  const byReason = useMemo(
    () => (filter === 'all' ? items : items.filter((item) => item.exitReason === filter)),
    [items, filter],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toUpperCase()
    if (!q) return byReason
    return byReason.filter((item) => item.symbol.includes(q))
  }, [byReason, search])

  return (
    <section className="exited-watchlist-page">
      <PageHeader
        icon="archive"
        title="Exited Watchlist"
        subtitle="Stocks you've dropped from the watchlist, with why — a symbol can show up more than once."
      />

      {loading && <p className="exited-watchlist-page__state">Loading…</p>}

      {error && (
        <p className="exited-watchlist-page__state exited-watchlist-page__state--error">
          Couldn’t load the exited watchlist: {error}. Is the backend running on port 4000?
        </p>
      )}

      {!loading && !error && (
        <>
          <div className="exited-watchlist-page__toolbar">
            <TickerSearch value={search} onChange={setSearch} />
            <ReasonFilterSelect
              active={filter}
              counts={counts}
              onChange={(next) => setSearchParams(next === 'all' ? {} : { reason: next })}
            />
          </div>

          {items.length === 0 ? (
            <p className="exited-watchlist-page__state">
              Nothing here yet — stocks you exit from the watchlist will show up here.
            </p>
          ) : filtered.length === 0 ? (
            <p className="exited-watchlist-page__state">
              {search.trim()
                ? `No tickers match "${search.trim()}".`
                : 'No exits with this reason yet.'}
            </p>
          ) : (
            <ExitedWatchlistTable items={filtered} onRemove={removeItem} />
          )}
        </>
      )}
    </section>
  )
}
