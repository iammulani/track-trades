import type { WatchSide } from '../../watchlist'
import type { VcpContraction } from '../types/placeTrade'

/** A stop tighter than this sits inside normal daily noise — it gets hit on a wiggle,
 * not on a broken thesis. */
export const MIN_RISK_PERCENT = 2
/** Beyond this the position is oversized for the setup, whatever the reward looks like. */
export const MAX_RISK_PERCENT = 10

/** Where the stop sits relative to the base, and whether the resulting risk is sized
 * sanely. `null` on either field means the inputs for it aren't entered yet — the caller
 * treats that as "pending", never as a failure. */
export interface StopPlacementCheck {
  /** Is the stop beyond the last contraction's low (long) / high (short) — i.e. outside
   * the base rather than inside it, where noise lives? */
  beyondBase: boolean | null
  /** The last contraction's low (long) / high (short) — the level the stop is judged against. */
  supportLevel: number | null
  /** Is the risk within `MIN_RISK_PERCENT`..`MAX_RISK_PERCENT` of entry? */
  sizeOk: boolean | null
  riskPercent: number | null
}

function toNumber(value: string): number | null {
  const n = Number(value)
  return value.trim() !== '' && Number.isFinite(n) ? n : null
}

/** The right-most contraction with both sides filled — the one the pivot is forming out of,
 * so the one whose extreme the stop has to clear. */
function lastFilledContraction(contractions: VcpContraction[]): { high: number; low: number } | null {
  for (let i = contractions.length - 1; i >= 0; i--) {
    const high = toNumber(contractions[i].high)
    const low = toNumber(contractions[i].low)
    if (high !== null && low !== null) return { high, low }
  }
  return null
}

/** Minervini places the stop at a level the thesis would have to break to reach — under the
 * last contraction's low — and sizes it so a normal pullback can't reach it and a real
 * failure doesn't cost too much. A stop parked inside the base flatters the risk:reward on
 * paper while guaranteeing a shake-out. Derived live, never stored. */
export function checkStopPlacement(
  side: WatchSide,
  entryPrice: string,
  stopLoss: string,
  contractions: VcpContraction[],
): StopPlacementCheck {
  const entry = toNumber(entryPrice)
  const stop = toNumber(stopLoss)
  const last = lastFilledContraction(contractions)
  const supportLevel = last === null ? null : side === 'long' ? last.low : last.high

  const beyondBase =
    stop === null || supportLevel === null
      ? null
      : side === 'long'
        ? stop <= supportLevel
        : stop >= supportLevel

  const direction = side === 'long' ? 1 : -1
  const riskPercent =
    entry !== null && stop !== null && entry !== 0 ? (((entry - stop) * direction) / entry) * 100 : null
  const sizeOk =
    riskPercent === null
      ? null
      : riskPercent >= MIN_RISK_PERCENT && riskPercent <= MAX_RISK_PERCENT

  return { beyondBase, supportLevel, sizeOk, riskPercent }
}

/** 0..1 — each of the two conditions is worth half, so a stop that clears the base but is
 * sized wrong still shows partial credit rather than reading as a total miss. */
export function stopPlacementScore(check: StopPlacementCheck): number {
  return (check.beyondBase === true ? 0.5 : 0) + (check.sizeOk === true ? 0.5 : 0)
}
