import { useState } from 'react'
import { Card } from '../../../shared/components/Card'
import { Icon } from '../../../shared/components/Icon'
import { formatPercent, formatSignedCurrency } from '../../../shared/utils/format'
import type { GateStat } from '../types/report'
import './GateScorecard.css'

interface GateScorecardProps {
  gates: GateStat[]
}

/** Worst-first, so the row at the top is the rule costing the most. */
export function GateScorecard({ gates }: GateScorecardProps) {
  const [expanded, setExpanded] = useState<string | null>(gates[0]?.id ?? null)

  if (gates.length === 0) {
    return (
      <Card className="gates">
        <h3 className="gates__title">Non-negotiables</h3>
        <p className="gates__empty">
          No closed trade carries a setup rating yet, so there are no gate verdicts to
          aggregate.
        </p>
      </Card>
    )
  }

  return (
    <Card className="gates">
      <div className="gates__head">
        <h3 className="gates__title">Non-negotiables</h3>
        <p className="gates__sub">
          The four rules a setup cannot buy its way past, as judged when each trade was
          placed. Worst compliance first — with what breaking it has cost.
        </p>
      </div>

      <ul className="gates__list">
        {gates.map((gate) => {
          const judged = gate.passed.length + gate.failed.length
          const isOpen = expanded === gate.id
          const clean = gate.failed.length === 0
          return (
            <li key={gate.id} className={`gates__row${clean ? ' is-clean' : ''}`}>
              <button
                type="button"
                className="gates__toggle"
                onClick={() => setExpanded(isOpen ? null : gate.id)}
                aria-expanded={isOpen}
              >
                <span className={`gates__chip gates__chip--${clean ? 'good' : 'critical'}`}>
                  <Icon name={clean ? 'check' : 'alert'} size={15} />
                </span>

                <span className="gates__body">
                  <span className="gates__label">{gate.label}</span>
                  <span className="gates__meta">
                    Honoured on {gate.passed.length} of {judged} trades
                    {gate.failed.length > 0 && (
                      <>
                        {' · '}
                        <span className="gates__leak">
                          {formatSignedCurrency(gate.leakCost)} while broken
                        </span>
                      </>
                    )}
                  </span>
                </span>

                <span className="gates__score">
                  <span className="gates__score-value">
                    {formatPercent((gate.complianceRatio || 0) * 100, 0)}
                  </span>
                  <span className="gates__bar" aria-hidden="true">
                    <span
                      className="gates__bar-fill"
                      style={{ width: `${gate.complianceRatio * 100}%` }}
                    />
                  </span>
                </span>

                <Icon name={isOpen ? 'chevronLeft' : 'chevronRight'} size={16} />
              </button>

              {isOpen && (
                <div className="gates__detail">
                  <p className="gates__reason">{gate.reason}</p>
                  {gate.failed.length > 0 && (
                    <p className="gates__offenders">
                      <span className="gates__offenders-label">Broken on:</span>{' '}
                      {gate.failed.map((t, i) => (
                        <span key={t.trade.id}>
                          {i > 0 && ', '}
                          <span className="gates__symbol">{t.trade.symbol}</span>{' '}
                          <span className="gates__symbol-pnl">
                            ({formatSignedCurrency(t.trade.metrics.pnl ?? 0)})
                          </span>
                        </span>
                      ))}
                    </p>
                  )}
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </Card>
  )
}
