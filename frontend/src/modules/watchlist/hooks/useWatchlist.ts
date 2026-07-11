import { useCallback, useEffect, useState } from 'react'
import { addWatchlistItem, fetchWatchlist, removeWatchlistItem } from '../api/watchlistApi'
import type { NewWatchlistItem, WatchlistItemWithMetrics } from '../types/watchlistItem'
import { sortByWatchedDesc, withWatchMetrics } from '../utils/watchlistMetrics'

interface WatchlistState {
  items: WatchlistItemWithMetrics[]
  loading: boolean
  error: string | null
  adding: boolean
  addItem: (input: NewWatchlistItem) => Promise<void>
  removeItem: (id: string) => Promise<void>
}

/** Fetches the watchlist and derives "how long watched" for each item. */
export function useWatchlist(): WatchlistState {
  const [items, setItems] = useState<WatchlistItemWithMetrics[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    return fetchWatchlist()
      .then((raw) => {
        setItems(sortByWatchedDesc(raw.map(withWatchMetrics)))
        setError(null)
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to load watchlist')
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const addItem = useCallback(
    async (input: NewWatchlistItem) => {
      setAdding(true)
      try {
        await addWatchlistItem(input)
        await load()
      } finally {
        setAdding(false)
      }
    },
    [load],
  )

  const removeItem = useCallback(
    async (id: string) => {
      await removeWatchlistItem(id)
      await load()
    },
    [load],
  )

  return { items, loading, error, adding, addItem, removeItem }
}
