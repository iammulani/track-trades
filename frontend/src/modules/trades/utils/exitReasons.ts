import type { ExitReason } from '../types/trade'

interface ExitReasonOption {
  value: ExitReason
  label: string
}

/** A trade can carry more than one takeaway (e.g. both "Hit Target" and a process
 * mistake), but it's capped so the field stays a handful of deliberate picks, not a
 * dumping ground. */
export const MAX_EXIT_REASONS = 5

/** Fixed order + labels for the exit-reason field — the single source of truth so the
 * exit form's dropdown and any later reporting/labels can't drift from each other. */
export const EXIT_REASON_OPTIONS: ExitReasonOption[] = [
  { value: 'hit-target', label: 'Hit Target' },
  { value: 'stopped-as-planned', label: 'Stopped Out — As Planned' },
  { value: 'stopped-widened', label: 'Stopped Out — Widened Stop' },
  { value: 'trailing-stop', label: 'Trailing Stop' },
  { value: 'thesis-changed', label: 'Discretionary — Thesis Changed' },
  { value: 'time-based', label: 'Time-Based Exit' },
  { value: 'mistake-emotional', label: 'Mistake — Emotional / Fear' },
  { value: 'mistake-broke-rule', label: 'Mistake — Broke Trading Rule' },
  { value: 'mistake-missed-signal', label: 'Mistake — Missed Exit Signal' },
  { value: 'market-news-event', label: 'Market / News Event' },
  { value: 'other', label: 'Other' },
]

export function exitReasonLabel(value: ExitReason | null | undefined): string | null {
  if (!value) return null
  return EXIT_REASON_OPTIONS.find((o) => o.value === value)?.label ?? value
}
