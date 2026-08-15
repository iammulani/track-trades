import type { ExitReason } from '../types/exitedWatchlistItem'

interface ExitReasonOption {
  value: ExitReason
  label: string
}

/** Fixed order + labels for the exit-reason field — the single source of truth so the
 * exit modal's dropdown, the review list's filter, and any labels can't drift apart. */
export const EXIT_REASONS: ExitReasonOption[] = [
  { value: 'fundamentals-poor', label: 'Fundamentals Poor' },
  { value: 'peer-comparison-failed', label: 'Peer Comparison Failed' },
  { value: 'vcp-failed', label: 'VCP / Base Failed' },
  { value: 'no-follow-through', label: 'No Follow-Through After Breakout' },
  { value: 'broke-key-support', label: 'Broke Key Support' },
  { value: 'stage-2-broken', label: 'Left Stage 2 Uptrend' },
  { value: 'thesis-invalidated', label: 'Thesis Invalidated' },
  { value: 'too-extended', label: 'Too Extended / Late Entry' },
  { value: 'better-setup-elsewhere', label: 'Better Setup Elsewhere' },
  { value: 'sector-rotated-out', label: 'Sector Rotated Out' },
  { value: 'low-liquidity', label: 'Low Liquidity' },
  { value: 'lost-interest', label: 'Lost Interest' },
  { value: 'other', label: 'Other' },
]

export function exitReasonLabel(value: ExitReason): string {
  return EXIT_REASONS.find((r) => r.value === value)?.label ?? value
}
