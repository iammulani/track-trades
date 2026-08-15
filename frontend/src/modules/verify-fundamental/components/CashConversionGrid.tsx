import { HoverCard } from '../../../shared/components/HoverCard'
import { Icon } from '../../../shared/components/Icon'
import {
  cashConversionTone,
  deriveCashConversion,
  selfFundedNote,
  type DebtEquityYear,
} from '../../fundamentals'
import './CashConversionGrid.css'

interface CashConversionGridProps {
  rows: DebtEquityYear[]
  /** Named into each Self-Funded hover note ("VIJAYA spent ₹98cr on capex…") so the explanation
   * reads like something said about this specific stock, not a generic template. */
  symbol: string
  onChange: (year: string, patch: Partial<Omit<DebtEquityYear, 'year'>>) => void
}

function toneClass(tone: string | null): string {
  return tone ? ` is-${tone}` : ''
}

/** Cash from Operating/Investing/Financing Activity and Net Profit are the only editable cells —
 * Cash Conversion and the Self-Funded flag are both derived live from them, same "type the raw
 * figures, never the ratio" rule every other grid follows. Shares Debt to Equity's annual
 * rows/period axis (same "as of" year, same year count) rather than a second one of its own —
 * both come off the same fiscal-year list on the source site. Purely informational: colour is a
 * fixed threshold read, not a scored rating. */
export function CashConversionGrid({ rows, symbol, onChange }: CashConversionGridProps) {
  if (rows.length === 0) {
    return <p className="cash-conversion-grid__empty">Pick an "As of" year above to generate the grid.</p>
  }

  const derived = deriveCashConversion(rows)

  return (
    <div className="cash-conversion-grid__scroll">
      <table className="cash-conversion-grid">
        <thead>
          <tr>
            <th className="ta-left">Year</th>
            <th className="ta-right">Operating</th>
            <th className="ta-right">Investing (Capex)</th>
            <th className="ta-right">Financing</th>
            <th className="ta-right">Net Profit</th>
            <th className="ta-right">Cash Conversion</th>
            <th className="ta-right">
              <span className="cash-conversion-grid__th-note">
                Self-Funded?
                <HoverCard
                  label="How Self-Funded is decided"
                  trigger={<Icon name="info" size={12} />}
                >
                  <p className="cash-conversion-grid__th-note-panel">
                    Cash from Operating Activity &gt; Capex — does operating cash alone cover what
                    the business spent growing itself, without needing outside financing?
                  </p>
                </HoverCard>
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const d = derived[i]
            return (
              <tr key={row.year}>
                <td className="ta-left cash-conversion-grid__year">{row.year}</td>
                <td className="ta-right">
                  <input
                    type="number"
                    step="any"
                    className="cash-conversion-grid__input"
                    value={row.cashFromOperatingActivity ?? ''}
                    onChange={(e) => onChange(row.year, { cashFromOperatingActivity: e.target.value })}
                    placeholder="—"
                  />
                </td>
                <td className="ta-right">
                  <input
                    type="number"
                    step="any"
                    className="cash-conversion-grid__input"
                    value={row.cashFromInvestingActivity ?? ''}
                    onChange={(e) => onChange(row.year, { cashFromInvestingActivity: e.target.value })}
                    placeholder="—"
                  />
                </td>
                <td className="ta-right">
                  <input
                    type="number"
                    step="any"
                    className="cash-conversion-grid__input"
                    value={row.cashFromFinancingActivity ?? ''}
                    onChange={(e) => onChange(row.year, { cashFromFinancingActivity: e.target.value })}
                    placeholder="—"
                  />
                </td>
                <td className="ta-right">
                  <input
                    type="number"
                    step="any"
                    className="cash-conversion-grid__input"
                    value={row.netProfit ?? ''}
                    onChange={(e) => onChange(row.year, { netProfit: e.target.value })}
                    placeholder="—"
                  />
                </td>
                <td
                  className={`ta-right cash-conversion-grid__ratio${toneClass(cashConversionTone(d.ratio))}`}
                >
                  {d.ratio !== null ? d.ratio.toFixed(2) : '—'}
                </td>
                <td
                  className={`ta-right cash-conversion-grid__flag${toneClass(d.selfFunded === null ? null : d.selfFunded ? 'good' : 'bad')}`}
                >
                  {d.selfFunded === null ? (
                    '—'
                  ) : (
                    <HoverCard
                      label={`Why ${row.year} is ${d.selfFunded ? 'Yes' : 'No'}`}
                      triggerClassName="hover-card__trigger--plain cash-conversion-grid__flag-trigger"
                      trigger={d.selfFunded ? 'Yes' : 'No'}
                    >
                      <p className="cash-conversion-grid__th-note-panel">
                        {selfFundedNote(symbol, d.cashFromOperatingActivity, d.cashFromInvestingActivity)}
                      </p>
                    </HoverCard>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
