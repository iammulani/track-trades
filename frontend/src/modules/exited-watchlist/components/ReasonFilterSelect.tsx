import { EXIT_REASONS } from '../utils/exitReasons'
import type { ExitReason } from '../types/exitedWatchlistItem'
import './ReasonFilterSelect.css'

export type ReasonFilter = ExitReason | 'all'

interface ReasonFilterSelectProps {
  active: ReasonFilter
  counts: Record<ReasonFilter, number>
  onChange: (filter: ReasonFilter) => void
}

/** Filters the exited list by why the stock was exited — a dropdown rather than pill
 * tabs since there are too many reasons for one scannable row. */
export function ReasonFilterSelect({ active, counts, onChange }: ReasonFilterSelectProps) {
  return (
    <select
      className="reason-filter"
      value={active}
      onChange={(e) => onChange(e.target.value as ReasonFilter)}
      aria-label="Filter by exit reason"
    >
      <option value="all">All reasons ({counts.all})</option>
      {EXIT_REASONS.map((r) => (
        <option key={r.value} value={r.value}>
          {r.label} ({counts[r.value]})
        </option>
      ))}
    </select>
  )
}
