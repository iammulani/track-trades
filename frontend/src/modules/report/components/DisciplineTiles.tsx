import { StatTile } from '../../../shared/components/StatTile'
import type { PerformanceStats } from '../types/report'
import './DisciplineTiles.css'

interface DisciplineTilesProps {
  stats: PerformanceStats
  tradesWithMistakes: number
}

/**
 * The three numbers that say whether the process was followed, as opposed to whether the
 * trading made money. These are the figures that mean something at a small sample: they
 * don't need a statistical edge to be read, they're just counts of rules broken.
 */
export function DisciplineTiles({ stats, tradesWithMistakes }: DisciplineTilesProps) {
  return (
    <div className="discipline">
      <StatTile
        label="Traded against the rating"
        value={`${stats.tradedAgainstRating} of ${stats.ratedCount}`}
        icon="alert"
        tone={stats.tradedAgainstRating > 0 ? 'critical' : 'good'}
        sub="Placed while the score read “don’t trade”"
      />

      <StatTile
        label="Stop leaks"
        value={`${stats.stopLeaks} of ${stats.closedCount}`}
        icon="arrowDownRight"
        tone={stats.stopLeaks > 0 ? 'critical' : 'good'}
        sub="Lost more than the risk they planned"
      />

      <StatTile
        label="Self-flagged mistakes"
        value={`${tradesWithMistakes} of ${stats.closedCount}`}
        icon="star"
        tone={tradesWithMistakes > 0 ? 'amber' : 'good'}
        sub="Trades carrying a mistake note"
      />
    </div>
  )
}
