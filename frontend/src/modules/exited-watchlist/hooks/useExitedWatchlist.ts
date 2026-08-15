import { useCallback, useEffect, useState } from 'react'
import { fetchExitedWatchlist, removeExitedWatchlistItem } from '../api/exitedWatchlistApi'
import type { ExitedWatchlistItem } from '../types/exitedWatchlistItem'

interface ExitedWatchlistState {
  items: ExitedWatchlistItem[]
  loading: boolean
  error: string | null
  removeItem: (id: string) => Promise<void>
}

/** Fetches the exited-watchlist log, newest exit first. */
export function useExitedWatchlist(): ExitedWatchlistState {
  const [items, setItems] = useState<ExitedWatchlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /** silent = true skips the loading flag, so removing an entry doesn't flash the whole
   * list away while it reloads. */
  const load = useCallback((silent = false) => {
    if (!silent) setLoading(true)
    return fetchExitedWatchlist()
      .then((raw) => {
        setItems(
          [...raw].sort((a, b) => Date.parse(b.exitedAt) - Date.parse(a.exitedAt)),
        )
        setError(null)
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to load exited watchlist')
      })
      .finally(() => {
        if (!silent) setLoading(false)
      })
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const removeItem = useCallback(
    async (id: string) => {
      await removeExitedWatchlistItem(id)
      await load(true)
    },
    [load],
  )

  return { items, loading, error, removeItem }
}
