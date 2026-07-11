import { useDashboard } from './hooks/useDashboard'
import { StatsGrid } from './components/StatsGrid'
import { TradesTable } from './components/TradesTable'
import './DashboardPage.css'

export function DashboardPage() {
  const { trades, summary, loading, error } = useDashboard()

  return (
    <section className="dashboard">
      <header className="dashboard__header">
        <h1>Dashboard</h1>
        <p className="dashboard__subtitle">Your trades, win rate, and performance at a glance.</p>
      </header>

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
