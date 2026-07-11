import { useMemo } from 'react'
import { buildEquitySeries, useTrades } from '../trades'
import { EquityCurve } from './components/EquityCurve'
import './EquityPage.css'

export function EquityPage() {
  const { trades, loading, error } = useTrades()
  const equity = useMemo(() => buildEquitySeries(trades), [trades])

  return (
    <section className="equity-page">
      <header className="equity-page__header">
        <h1 className="equity-page__title">Equity Curve</h1>
        <p className="equity-page__subtitle">
          Cumulative profit and loss across all closed trades.
        </p>
      </header>

      {loading && <p className="equity-page__state">Loading trades…</p>}

      {error && (
        <p className="equity-page__state equity-page__state--error">
          Couldn’t load trades: {error}. Is the backend running on port 4000?
        </p>
      )}

      {!loading && !error && (
        <>
          {equity.length > 1 ? (
            <EquityCurve points={equity} />
          ) : (
            <p className="equity-page__state">Not enough closed trades yet to plot a curve.</p>
          )}
        </>
      )}
    </section>
  )
}
