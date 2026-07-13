import { Card } from '../../../shared/components/Card'
import { Icon } from '../../../shared/components/Icon'
import type { MistakeStat } from '../types/report'
import './MistakeLedger.css'

interface MistakeLedgerProps {
  stats: MistakeStat[]
  tradesWithMistakes: number
  closedCount: number
}

/** Exit reasons grouped, with the notes quoted verbatim — the journal's own words are the
 * finding, so the report shows them rather than reducing them to a count. */
export function MistakeLedger({ stats, tradesWithMistakes, closedCount }: MistakeLedgerProps) {
  if (stats.length === 0) {
    return (
      <Card className="ledger">
        <h3 className="ledger__title">Exit ledger</h3>
        <p className="ledger__empty">No exit learnings recorded yet.</p>
      </Card>
    )
  }

  return (
    <Card className="ledger">
      <div className="ledger__head">
        <h3 className="ledger__title">Exit ledger</h3>
        <p className="ledger__sub">
          Every exit reason you recorded, with your own notes.{' '}
          <strong className="ledger__headline">
            {tradesWithMistakes} of {closedCount}
          </strong>{' '}
          closed trades carry a self-flagged mistake.
        </p>
      </div>

      <ul className="ledger__list">
        {stats.map((stat) => (
          <li
            key={stat.reason}
            className={`ledger__group${stat.isMistake ? ' is-mistake' : ''}`}
          >
            <div className="ledger__group-head">
              <span
                className={`ledger__chip ledger__chip--${stat.isMistake ? 'critical' : 'good'}`}
              >
                <Icon name={stat.isMistake ? 'alert' : 'check'} size={14} />
              </span>
              <span className="ledger__label">{stat.label}</span>
              <span className="ledger__count">
                ×{stat.count}
              </span>
            </div>

            {stat.notes.length > 0 && (
              <ul className="ledger__notes">
                {stat.notes.map((n, i) => (
                  <li key={`${n.symbol}-${i}`} className="ledger__note">
                    <span className="ledger__note-symbol">{n.symbol}</span>
                    <blockquote className="ledger__note-text">{n.note}</blockquote>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </Card>
  )
}
