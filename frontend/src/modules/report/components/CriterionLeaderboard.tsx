import { Card } from '../../../shared/components/Card'
import { formatPercent } from '../../../shared/utils/format'
import type { CriterionStat } from '../types/report'
import './CriterionLeaderboard.css'

interface CriterionLeaderboardProps {
  criteria: CriterionStat[]
}

/** Below this a criterion is a habit, not a slip. */
const WEAK_SCORE = 0.5

/** Every scored criterion, weakest first — the chronic gaps rank themselves. */
export function CriterionLeaderboard({ criteria }: CriterionLeaderboardProps) {
  if (criteria.length === 0) {
    return (
      <Card className="criteria">
        <h3 className="criteria__title">Where the setups lose points</h3>
        <p className="criteria__empty">No rated trades yet.</p>
      </Card>
    )
  }

  return (
    <Card className="criteria">
      <div className="criteria__head">
        <h3 className="criteria__title">Where the setups lose points</h3>
        <p className="criteria__sub">
          Average score per criterion across every rated trade, weakest first. Weight is how
          much the rating leans on it — a low score on a heavy criterion is the expensive kind.
        </p>
      </div>

      <ul className="criteria__list">
        {criteria.map((c) => {
          const weak = c.avgScore < WEAK_SCORE
          return (
            <li key={c.id} className="criteria__row">
              <span className="criteria__label">
                {c.label}
                <span className="criteria__weight">weight {c.weight}</span>
              </span>

              <span className="criteria__track" aria-hidden="true">
                <span
                  className={`criteria__fill${weak ? ' is-weak' : ''}`}
                  style={{ width: `${Math.max(c.avgScore * 100, 1.5)}%` }}
                />
              </span>

              <span className={`criteria__score${weak ? ' is-weak' : ''}`}>
                {formatPercent(c.avgScore * 100, 0)}
              </span>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}
