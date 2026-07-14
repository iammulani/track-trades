import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchDrafts, removeDraft } from '../api/draftsApi'
import type { TradeDraft } from '../types/draft'

interface DraftsState {
  drafts: TradeDraft[]
  /** Draft keyed by the watchlist item it belongs to — how every consumer looks one up. */
  byWatchlistId: Record<string, TradeDraft>
  loading: boolean
  error: string | null
  /** Throws away the draft parked against a watchlist item; a no-op if there isn't one. */
  discard: (watchlistId: string) => Promise<void>
}

/** Loads every parked stepper run, indexed by watchlist item. */
export function useDrafts(): DraftsState {
  const [drafts, setDrafts] = useState<TradeDraft[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /** silent = true skips the loading flag, so a refetch after a discard doesn't
   * flash the list away while it reloads. */
  const load = useCallback((silent = false) => {
    if (!silent) setLoading(true)
    return fetchDrafts()
      .then((raw) => {
        setDrafts(raw)
        setError(null)
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to load drafts')
      })
      .finally(() => {
        if (!silent) setLoading(false)
      })
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const byWatchlistId = useMemo(() => {
    const map: Record<string, TradeDraft> = {}
    for (const draft of drafts) map[draft.watchlistId] = draft
    return map
  }, [drafts])

  const discard = useCallback(
    async (watchlistId: string) => {
      const draft = byWatchlistId[watchlistId]
      if (!draft) return
      await removeDraft(draft.id)
      await load(true)
    },
    [byWatchlistId, load],
  )

  return { drafts, byWatchlistId, loading, error, discard }
}
