import { useMemo } from 'react'
import { PageHeader } from '../../shared/components/PageHeader'
import { useTrades } from '../trades'
import { CriterionLeaderboard } from './components/CriterionLeaderboard'
import { DisciplineTiles } from './components/DisciplineTiles'
import { GateScorecard } from './components/GateScorecard'
import { MistakeLedger } from './components/MistakeLedger'
import { PerformanceSection } from './components/PerformanceSection'
import { RMultipleChart } from './components/RMultipleChart'
import { RatingVsOutcomeChart } from './components/RatingVsOutcomeChart'
import { SampleBanner } from './components/SampleBanner'
import { buildCriterionStats } from './utils/criterionStats'
import { buildGateStats } from './utils/gateStats'
import { buildMistakeStats, countTradesWithMistakes } from './utils/mistakeStats'
import { buildPerformanceStats } from './utils/performanceStats'
import { buildReportTrades } from './utils/reportTrades'
import './ReportPage.css'

/**
 * The consolidated review: what the trading returned (performance) and whether the process
 * that produced it was followed (discipline). Both halves carry equal weight — at a small
 * sample the second half is the one that can actually be acted on.
 */
export function ReportPage() {
  const { trades, loading, error } = useTrades()

  const report = useMemo(() => {
    const reportTrades = buildReportTrades(trades)
    return {
      reportTrades,
      performance: buildPerformanceStats(reportTrades),
      gates: buildGateStats(reportTrades),
      criteria: buildCriterionStats(reportTrades),
      mistakes: buildMistakeStats(reportTrades),
      tradesWithMistakes: countTradesWithMistakes(reportTrades),
    }
  }, [trades])

  const hasClosed = report.reportTrades.length > 0

  return (
    <section className="report">
      <PageHeader
        icon="report"
        title="Report"
        subtitle="What your trading returned, and whether you followed your own rules getting there."
      />

      {loading && <p className="report__state">Loading trades…</p>}

      {error && (
        <p className="report__state report__state--error">
          Couldn’t load trades: {error}. Is the backend running on port 4000?
        </p>
      )}

      {!loading && !error && !hasClosed && (
        <p className="report__state">
          No closed trades yet — the report fills in as you exit positions.
        </p>
      )}

      {!loading && !error && hasClosed && (
        <div className="report__body">
          <SampleBanner closedCount={report.performance.closedCount} />

          <section className="report__block">
            <h2 className="report__heading">Performance</h2>
            <PerformanceSection stats={report.performance} />
            <RMultipleChart trades={report.reportTrades} />
          </section>

          <section className="report__block">
            <h2 className="report__heading">Process</h2>
            <DisciplineTiles
              stats={report.performance}
              tradesWithMistakes={report.tradesWithMistakes}
            />
            <GateScorecard gates={report.gates} />
            <RatingVsOutcomeChart trades={report.reportTrades} />
            <CriterionLeaderboard criteria={report.criteria} />
            <MistakeLedger
              stats={report.mistakes}
              tradesWithMistakes={report.tradesWithMistakes}
              closedCount={report.performance.closedCount}
            />
          </section>
        </div>
      )}
    </section>
  )
}
