import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchFundamentals, removeFundamentals } from '../api/fundamentalsApi'
import type { FundamentalsRecord } from '../types/fundamentals'

interface FundamentalsState {
  records: FundamentalsRecord[]
  /** Record keyed by the watchlist item it belongs to — how every consumer looks one up. */
  byWatchlistItemId: Record<string, FundamentalsRecord>
  loading: boolean
  error: string | null
  /** Deletes the record parked against a watchlist item; a no-op if there isn't one. */
  removeFor: (watchlistItemId: string) => Promise<void>
}

/** Loads every quarterly-fundamentals record, indexed by watchlist item. */
export function useFundamentals(): FundamentalsState {
  const [records, setRecords] = useState<FundamentalsRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /** silent = true skips the loading flag, so a refetch after a removal doesn't
   * flash the list away while it reloads. */
  const load = useCallback((silent = false) => {
    if (!silent) setLoading(true)
    return fetchFundamentals()
      .then((raw) => {
        setRecords(raw)
        setError(null)
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to load fundamentals')
      })
      .finally(() => {
        if (!silent) setLoading(false)
      })
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const byWatchlistItemId = useMemo(() => {
    const map: Record<string, FundamentalsRecord> = {}
    for (const record of records) map[record.watchlistItemId] = record
    return map
  }, [records])

  const removeFor = useCallback(
    async (watchlistItemId: string) => {
      const record = byWatchlistItemId[watchlistItemId]
      if (!record) return
      await removeFundamentals(record.id)
      await load(true)
    },
    [byWatchlistItemId, load],
  )

  return { records, byWatchlistItemId, loading, error, removeFor }
}
