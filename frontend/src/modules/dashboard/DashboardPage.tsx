import { PageHeader } from '../../shared/components/PageHeader'
import { useTrades } from '../trades'
import { StatsGrid } from './components/StatsGrid'
import { TradesTable } from './components/TradesTable'
import './DashboardPage.css'

export function DashboardPage() {
  const { trades, summary, loading, error } = useTrades()

  return (
    <section className="dashboard">
      <PageHeader
        icon="dashboard"
        title="Dashboard"
        subtitle="Your trades, win rate, and performance at a glance."
      />

      {loading && <p className="dashboard__state">Loading trades…</p>}

      {error && (
        <p className="dashboard__state dashboard__state--error">
          Couldn’t load trades: {error}. Is the backend running on port 4000?
        </p>
      )}

      {!loading && !error && summary && (
        <>
          <StatsGrid summary={summary} />

          {trades.length === 0 ? (
            <p className="dashboard__state">No trades yet.</p>
          ) : (
            <TradesTable trades={trades} />
          )}
        </>
      )}
    </section>
  )
}
