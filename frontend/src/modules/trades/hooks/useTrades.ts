import { useEffect, useState } from 'react'
import { fetchTrades } from '../api/tradesApi'
import type { DashboardSummary, TradeWithMetrics } from '../types/trade'
import { sortByEntryDesc, summarize, withMetrics } from '../utils/tradeMetrics'

interface TradesState {
  trades: TradeWithMetrics[]
  summary: DashboardSummary | null
  loading: boolean
  error: string | null
}

/**
 * Fetches trades and derives per-trade metrics + the summary. Shared by any
 * feature module that needs trade data (dashboard, equity, …).
 */
export function useTrades(): TradesState {
  const [state, setState] = useState<TradesState>({
    trades: [],
    summary: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    let active = true

    fetchTrades()
      .then((raw) => {
        if (!active) return
        const trades = sortByEntryDesc(raw.map(withMetrics))
        setState({ trades, summary: summarize(trades), loading: false, error: null })
      })
      .catch((err: unknown) => {
        if (!active) return
        const message = err instanceof Error ? err.message : 'Failed to load trades'
        setState({ trades: [], summary: null, loading: false, error: message })
      })

    return () => {
      active = false
    }
  }, [])

  return state
}
