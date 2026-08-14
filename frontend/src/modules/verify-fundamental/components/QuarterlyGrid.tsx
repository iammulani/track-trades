import { HoverCard } from '../../../shared/components/HoverCard'
import { Icon } from '../../../shared/components/Icon'
import { formatPercent, formatSignedPercent } from '../../../shared/utils/format'
import { deriveQuarters, formatPeriodLabel, type Code33Rating, type QuarterFinancials } from '../../fundamentals'
import './QuarterlyGrid.css'

interface QuarterlyGridProps {
  rows: QuarterFinancials[]
  rating: Code33Rating
  onChange: (period: string, patch: Partial<Omit<QuarterFinancials, 'period'>>) => void
}

type MetricTone = 'good' | 'bad' | null

interface PeriodTones {
  eps: MetricTone
  sales: MetricTone
  margin: MetricTone
}

/** Every quarter that's the *later* half of a step in `rating.steps` gets a tone per metric —
 * green if that metric accelerated/expanded there, red if it didn't. A quarter with no step
 * ending on it (no YoY data yet, or it's the window's own baseline quarter) has nothing to
 * compare against, so it stays untoned rather than guessing. */
function buildToneMap(rating: Code33Rating): Record<string, PeriodTones> {
  const map: Record<string, PeriodTones> = {}
  for (const step of rating.steps) {
    map[step.toPeriod] = {
      eps: step.epsAccelerated ? 'good' : 'bad',
      sales: step.salesAccelerated ? 'good' : 'bad',
      margin: step.marginExpanded ? 'good' : 'bad',
    }
  }
  return map
}

function toneClass(tone: MetricTone): string {
  return tone ? ` is-${tone}` : ''
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
  const tones = buildToneMap(rating)

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
                <td className={`ta-right quarterly-grid__derived${toneClass(tone?.margin ?? null)}`}>
                  {d.netMargin !== null ? formatPercent(d.netMargin) : '—'}
                </td>
                <td className={`ta-right quarterly-grid__derived${toneClass(tone?.sales ?? null)}`}>
                  {d.salesGrowthYoY !== null ? formatSignedPercent(d.salesGrowthYoY) : '—'}
                </td>
                <td className={`ta-right quarterly-grid__derived${toneClass(tone?.eps ?? null)}`}>
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
