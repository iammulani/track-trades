import { useEffect, useState } from 'react'
import { fetchTrades } from '../api/tradesApi'
import type { DashboardSummary, TradeWithMetrics } from '../types/trade'
import { sortByEntryDesc, summarize, withMetrics } from '../utils/tradeMetrics'

interface DashboardState {
  trades: TradeWithMetrics[]
  summary: DashboardSummary | null
  loading: boolean
  error: string | null
}

/** Fetches trades and derives per-trade metrics + the dashboard summary. */
export function useDashboard(): DashboardState {
  const [state, setState] = useState<DashboardState>({
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
