import { useCallback, useEffect, useState } from 'react'
import {
  addWatchlistItem,
  fetchWatchlist,
  removeWatchlistItem,
  updateWatchlistCategory,
} from '../api/watchlistApi'
import type {
  NewWatchlistItem,
  WatchCategory,
  WatchlistItemWithMetrics,
} from '../types/watchlistItem'
import { sortByWatchedDesc, withWatchMetrics } from '../utils/watchlistMetrics'

interface WatchlistState {
  items: WatchlistItemWithMetrics[]
  loading: boolean
  error: string | null
  adding: boolean
  addItem: (input: NewWatchlistItem) => Promise<void>
  removeItem: (id: string) => Promise<void>
  updateCategory: (id: string, category: WatchCategory) => Promise<void>
}

/** Fetches the watchlist and derives "how long watched" for each item. */
export function useWatchlist(): WatchlistState {
  const [items, setItems] = useState<WatchlistItemWithMetrics[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)

  /** silent = true skips the loading flag, so a refetch after add/remove/update
   * doesn't flash the whole list away while it reloads. */
  const load = useCallback((silent = false) => {
    if (!silent) setLoading(true)
    return fetchWatchlist()
      .then((raw) => {
        setItems(sortByWatchedDesc(raw.map(withWatchMetrics)))
        setError(null)
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to load watchlist')
      })
      .finally(() => {
        if (!silent) setLoading(false)
      })
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const addItem = useCallback(
    async (input: NewWatchlistItem) => {
      setAdding(true)
      try {
        await addWatchlistItem(input)
        await load(true)
      } finally {
        setAdding(false)
      }
    },
    [load],
  )

  const removeItem = useCallback(
    async (id: string) => {
      await removeWatchlistItem(id)
      await load(true)
    },
    [load],
  )

  const updateCategory = useCallback(
    async (id: string, category: WatchCategory) => {
      await updateWatchlistCategory(id, category)
      await load(true)
    },
    [load],
  )

  return { items, loading, error, adding, addItem, removeItem, updateCategory }
}
