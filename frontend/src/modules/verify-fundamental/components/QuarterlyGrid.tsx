import { deriveQuarters, formatPeriodLabel, type QuarterFinancials } from '../../fundamentals'
import { Icon } from '../../../shared/components/Icon'
import { formatPercent, formatSignedPercent } from '../../../shared/utils/format'
import './QuarterlyGrid.css'

interface QuarterlyGridProps {
  rows: QuarterFinancials[]
  onChange: (period: string, patch: Partial<Omit<QuarterFinancials, 'period'>>) => void
}

/** Every value the user types drives the derived columns live — Net Margin, Sales YoY, and
 * EPS YoY are never entered, only Sales/Net Profit/EPS are. */
export function QuarterlyGrid({ rows, onChange }: QuarterlyGridProps) {
  if (rows.length === 0) {
    return (
      <p className="quarterly-grid__empty">
        Pick a "Data from" quarter above to generate the grid.
      </p>
    )
  }

  const derived = deriveQuarters(rows)

  return (
    <div className="quarterly-grid__scroll">
      <table className="quarterly-grid">
        <thead>
          <tr>
            <th className="ta-left">Quarter</th>
            <th className="ta-right">Sales</th>
            <th className="ta-right">Net Profit</th>
            <th className="ta-right">EPS</th>
            <th className="ta-right">
              <span
                className="quarterly-grid__th-note"
                title="Net Profit ÷ Sales × 100, for this quarter"
              >
                Net Margin
                <Icon name="info" size={12} />
              </span>
            </th>
            <th className="ta-right">Sales YoY</th>
            <th className="ta-right">EPS YoY</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const d = derived[i]
            return (
              <tr key={row.period}>
                <td className="ta-left quarterly-grid__period">{formatPeriodLabel(row.period)}</td>
                <td className="ta-right">
                  <input
                    type="number"
                    step="any"
                    className="quarterly-grid__input"
                    value={row.sales}
                    onChange={(e) => onChange(row.period, { sales: e.target.value })}
                    placeholder="—"
                  />
                </td>
                <td className="ta-right">
                  <input
                    type="number"
                    step="any"
                    className="quarterly-grid__input"
                    value={row.netProfit}
                    onChange={(e) => onChange(row.period, { netProfit: e.target.value })}
                    placeholder="—"
                  />
                </td>
                <td className="ta-right">
                  <input
                    type="number"
                    step="any"
                    className="quarterly-grid__input"
                    value={row.eps}
                    onChange={(e) => onChange(row.period, { eps: e.target.value })}
                    placeholder="—"
                  />
                </td>
                <td className="ta-right quarterly-grid__derived">
                  {d.netMargin !== null ? formatPercent(d.netMargin) : '—'}
                </td>
                <td className="ta-right quarterly-grid__derived">
                  {d.salesGrowthYoY !== null ? formatSignedPercent(d.salesGrowthYoY) : '—'}
                </td>
                <td className="ta-right quarterly-grid__derived">
                  {d.epsGrowthYoY !== null ? formatSignedPercent(d.epsGrowthYoY) : '—'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
