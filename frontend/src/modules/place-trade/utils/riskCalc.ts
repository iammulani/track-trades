import type { WatchSide } from '../../watchlist'
import type { TradeParams } from '../types/placeTrade'

export interface RiskCalc {
  riskPerShare: number | null
  rewardPerShare: number | null
  riskAmount: number | null
  rewardAmount: number | null
  riskRewardRatio: number | null
}

function toNumber(value: string): number | null {
  const n = Number(value)
  return value.trim() !== '' && Number.isFinite(n) ? n : null
}

/** Derives risk/reward from entry, stop, target, and size — never stored, always recomputed. */
export function computeRisk(side: WatchSide, params: TradeParams): RiskCalc {
  const entry = toNumber(params.entryPrice)
  const stop = toNumber(params.stopLoss)
  const target = toNumber(params.target)
  const qty = toNumber(params.quantity)
  const direction = side === 'long' ? 1 : -1

  const riskPerShare = entry !== null && stop !== null ? (entry - stop) * direction : null
  const rewardPerShare = entry !== null && target !== null ? (target - entry) * direction : null

  const riskAmount = riskPerShare !== null && qty !== null ? riskPerShare * qty : null
  const rewardAmount = rewardPerShare !== null && qty !== null ? rewardPerShare * qty : null

  const riskRewardRatio =
    riskPerShare !== null && rewardPerShare !== null && riskPerShare > 0
      ? rewardPerShare / riskPerShare
      : null

  return { riskPerShare, rewardPerShare, riskAmount, rewardAmount, riskRewardRatio }
}
