import { debtEquityTone, deriveDebtEquity, type DebtEquityYear } from '../../fundamentals'
import './DebtEquityGrid.css'

interface DebtEquityGridProps {
  rows: DebtEquityYear[]
  onChange: (year: string, patch: Partial<Omit<DebtEquityYear, 'year'>>) => void
}

function toneClass(tone: string | null): string {
  return tone ? ` is-${tone}` : ''
}

/** Borrowings, Equity Capital and Reserves are the only editable cells — Debt/Equity is derived
 * live and colour-banded, same "type the raw figures, never the ratio" rule Code 33's grid
 * follows. Purely informational: the colour is a fixed threshold read, not a scored rating. */
export function DebtEquityGrid({ rows, onChange }: DebtEquityGridProps) {
  if (rows.length === 0) {
    return <p className="debt-equity-grid__empty">Pick an "As of" year above to generate the grid.</p>
  }

  const derived = deriveDebtEquity(rows)

  return (
    <div className="debt-equity-grid__scroll">
      <table className="debt-equity-grid">
        <thead>
          <tr>
            <th className="ta-left">Year</th>
            <th className="ta-right">Borrowings</th>
            <th className="ta-right">Equity Capital</th>
            <th className="ta-right">Reserves</th>
            <th className="ta-right">Debt/Equity</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const d = derived[i]
            return (
              <tr key={row.year}>
                <td className="ta-left debt-equity-grid__year">{row.year}</td>
                <td className="ta-right">
                  <input
                    type="number"
                    step="any"
                    className="debt-equity-grid__input"
                    value={row.borrowings}
                    onChange={(e) => onChange(row.year, { borrowings: e.target.value })}
                    placeholder="—"
                  />
                </td>
                <td className="ta-right">
                  <input
                    type="number"
                    step="any"
                    className="debt-equity-grid__input"
                    value={row.equityCapital}
                    onChange={(e) => onChange(row.year, { equityCapital: e.target.value })}
                    placeholder="—"
                  />
                </td>
                <td className="ta-right">
                  <input
                    type="number"
                    step="any"
                    className="debt-equity-grid__input"
                    value={row.reserves}
                    onChange={(e) => onChange(row.year, { reserves: e.target.value })}
                    placeholder="—"
                  />
                </td>
                <td className={`ta-right debt-equity-grid__ratio${toneClass(debtEquityTone(d.ratio))}`}>
                  {d.ratio !== null ? d.ratio.toFixed(2) : '—'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
