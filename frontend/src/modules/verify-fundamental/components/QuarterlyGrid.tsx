import { HoverCard } from '../../../shared/components/HoverCard'
import { Icon } from '../../../shared/components/Icon'
import { formatPercent, formatSignedPercent } from '../../../shared/utils/format'
import {
  buildQuarterTones,
  deriveQuarters,
  formatPeriodLabel,
  type Code33Rating,
  type QuarterFinancials,
} from '../../fundamentals'
import './QuarterlyGrid.css'

interface QuarterlyGridProps {
  rows: QuarterFinancials[]
  rating: Code33Rating
  onChange: (period: string, patch: Partial<Omit<QuarterFinancials, 'period'>>) => void
}

function toneClass(accelerated: boolean | undefined): string {
  return accelerated === undefined ? '' : accelerated ? ' is-good' : ' is-bad'
}

/** Every value the user types drives the derived columns live — Net Margin, Sales YoY, and
 * EPS YoY are never entered, only Sales/Net Profit/EPS are. Colour is how "did this accelerate"
 * reads at a glance; the exact figures are still in the Code 33 hover-cards, not just colour. */
export function QuarterlyGrid({ rows, rating, onChange }: QuarterlyGridProps) {
  if (rows.length === 0) {
    return (
      <p className="quarterly-grid__empty">
        Pick a "Data from" quarter above to generate the grid.
      </p>
    )
  }

  const derived = deriveQuarters(rows)
  const tones = buildQuarterTones(rating.steps)

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
              <span className="quarterly-grid__th-note">
                Net Margin
                <HoverCard
                  label="How Net Margin is calculated"
                  trigger={<Icon name="info" size={12} />}
                >
                  <p className="quarterly-grid__th-note-panel">
                    Net Profit ÷ Sales × 100, for this quarter.
                  </p>
                </HoverCard>
              </span>
            </th>
            <th className="ta-right">Sales YoY</th>
            <th className="ta-right">EPS YoY</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const d = derived[i]
            const tone = tones[row.period]
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
                <td className={`ta-right quarterly-grid__derived${toneClass(tone?.margin)}`}>
                  {d.netMargin !== null ? formatPercent(d.netMargin) : '—'}
                </td>
                <td className={`ta-right quarterly-grid__derived${toneClass(tone?.sales)}`}>
                  {d.salesGrowthYoY !== null ? formatSignedPercent(d.salesGrowthYoY) : '—'}
                </td>
                <td className={`ta-right quarterly-grid__derived${toneClass(tone?.eps)}`}>
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
