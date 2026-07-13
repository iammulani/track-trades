import { useCallback, useEffect, useState } from 'react'
import { closeTrade as closeTradeApi, fetchTrades } from '../api/tradesApi'
import type { CloseTradeInput, DashboardSummary, TradeWithMetrics } from '../types/trade'
import { sortByEntryDesc, summarize, withMetrics } from '../utils/tradeMetrics'

interface TradesState {
  trades: TradeWithMetrics[]
  summary: DashboardSummary | null
  loading: boolean
  error: string | null
  closing: boolean
  closeTrade: (id: string, input: CloseTradeInput) => Promise<void>
}

/**
 * Fetches trades and derives per-trade metrics + the summary. Shared by any
 * feature module that needs trade data (dashboard, equity, …).
 */
export function useTrades(): TradesState {
  const [trades, setTrades] = useState<TradeWithMetrics[]>([])
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [closing, setClosing] = useState(false)

  /** silent = true skips the loading flag, so closing a trade doesn't flash the
   * whole table away while it reloads. */
  const load = useCallback((silent = false) => {
    if (!silent) setLoading(true)
    return fetchTrades()
      .then((raw) => {
        const next = sortByEntryDesc(raw.map(withMetrics))
        setTrades(next)
        setSummary(summarize(next))
        setError(null)
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to load trades')
      })
      .finally(() => {
        if (!silent) setLoading(false)
      })
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const closeTrade = useCallback(
    async (id: string, input: CloseTradeInput) => {
      setClosing(true)
      try {
        await closeTradeApi(id, input)
        await load(true)
      } finally {
        setClosing(false)
      }
    },
    [load],
  )

  return { trades, summary, loading, error, closing, closeTrade }
}
