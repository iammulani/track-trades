import { useMemo } from 'react'
import { PageHeader } from '../../shared/components/PageHeader'
import { buildEquitySeries, useTrades } from '../trades'
import { EquityCurve } from './components/EquityCurve'
import './EquityPage.css'

export function EquityPage() {
  const { trades, loading, error } = useTrades()
  const equity = useMemo(() => buildEquitySeries(trades), [trades])

  return (
    <section className="equity-page">
      <PageHeader
        icon="trending"
        title="Equity Curve"
        subtitle="Cumulative profit and loss across all closed trades."
      />

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
