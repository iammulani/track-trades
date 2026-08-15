import { deriveInterestCoverage, formatPeriodLabel, interestCoverageTone, type QuarterFinancials } from '../../fundamentals'
import './InterestCoverageGrid.css'

interface InterestCoverageGridProps {
  rows: QuarterFinancials[]
  onChange: (period: string, patch: Partial<Omit<QuarterFinancials, 'period'>>) => void
}

function toneClass(tone: string | null): string {
  return tone ? ` is-${tone}` : ''
}

/** Operating Profit and Interest are the only editable cells — Interest Coverage is derived live
 * and colour-banded, same "type the raw figures, never the ratio" rule Code 33's grid follows.
 * Shares Code 33's quarterly rows/period axis (same "as of" quarter, same quarter count) rather
 * than a second one of its own — both come off the same Quarterly Results table on the source
 * site, so there's no reason to pick "as of" twice. Purely informational: the colour is a fixed
 * threshold read, not a scored rating. */
export function InterestCoverageGrid({ rows, onChange }: InterestCoverageGridProps) {
  if (rows.length === 0) {
    return <p className="interest-coverage-grid__empty">Pick an "As of" quarter above to generate the grid.</p>
  }

  const derived = deriveInterestCoverage(rows)

  return (
    <div className="interest-coverage-grid__scroll">
      <table className="interest-coverage-grid">
        <thead>
          <tr>
            <th className="ta-left">Quarter</th>
            <th className="ta-right">Operating Profit</th>
            <th className="ta-right">Interest</th>
            <th className="ta-right">Interest Coverage</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const d = derived[i]
            return (
              <tr key={row.period}>
                <td className="ta-left interest-coverage-grid__period">{formatPeriodLabel(row.period)}</td>
                <td className="ta-right">
                  <input
                    type="number"
                    step="any"
                    className="interest-coverage-grid__input"
                    value={row.operatingProfit ?? ''}
                    onChange={(e) => onChange(row.period, { operatingProfit: e.target.value })}
                    placeholder="—"
                  />
                </td>
                <td className="ta-right">
                  <input
                    type="number"
                    step="any"
                    className="interest-coverage-grid__input"
                    value={row.interest ?? ''}
                    onChange={(e) => onChange(row.period, { interest: e.target.value })}
                    placeholder="—"
                  />
                </td>
                <td
                  className={`ta-right interest-coverage-grid__ratio${toneClass(interestCoverageTone(d.ratio))}`}
                >
                  {d.ratio !== null ? `${d.ratio.toFixed(2)}x` : '—'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
