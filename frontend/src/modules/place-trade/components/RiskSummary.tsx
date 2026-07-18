import { formatSignedCurrency, formatSignedPercent } from '../../../shared/utils/format'
import type { WatchSide } from '../../watchlist'
import type { TradeParams } from '../types/placeTrade'
import { computeRisk } from '../utils/riskCalc'
import './RiskSummary.css'

interface RiskSummaryProps {
  side: WatchSide
  params: TradeParams
}

/** Normalized so the smaller side always reads "1" — "1:4.8" when the reward is bigger,
 * "2:1" when the risk is (flip it around rather than a sub-1 ratio like "1:0.4", which
 * reads as an afterthought instead of the warning it should be). */
function formatRatio(ratio: number | null): string {
  if (ratio === null || ratio <= 0) return '—'
  if (ratio >= 1) return `1:${ratio.toFixed(1)}`
  return `${(1 / ratio).toFixed(1)}:1`
}

/** Live risk/reward, recomputed from entry/stop/target/size — nothing here is stored. */
export function RiskSummary({ side, params }: RiskSummaryProps) {
  const risk = computeRisk(side, params)
  const ratioTone =
    risk.riskRewardRatio !== null ? (risk.riskRewardRatio >= 2 ? 'good' : 'default') : 'default'

  return (
    <div className="risk-summary">
      <div className="risk-summary__hero">
        <div className="risk-summary__hero-cell risk-summary__hero-cell--critical">
          <span className="risk-summary__hero-label">If stopped out</span>
          <span className="risk-summary__hero-value">
            {risk.riskPercent === null ? '—' : formatSignedPercent(-Math.abs(risk.riskPercent))}
          </span>
          <span className="risk-summary__hero-sub">
            {risk.riskAmount === null ? '—' : formatSignedCurrency(-Math.abs(risk.riskAmount))}
          </span>
        </div>
        <div className="risk-summary__hero-cell risk-summary__hero-cell--good">
          <span className="risk-summary__hero-label">If target hit</span>
          <span className="risk-summary__hero-value">
            {risk.rewardPercent === null ? '—' : formatSignedPercent(Math.abs(risk.rewardPercent))}
          </span>
          <span className="risk-summary__hero-sub">
            {risk.rewardAmount === null ? '—' : formatSignedCurrency(Math.abs(risk.rewardAmount))}
          </span>
        </div>
      </div>

      <div className="risk-summary__details">
        <div className="risk-summary__cell">
          <span className="risk-summary__label">Risk / share</span>
          <span className="risk-summary__value">
            {risk.riskPerShare === null ? '—' : formatSignedCurrency(-Math.abs(risk.riskPerShare))}
          </span>
        </div>
        <div className="risk-summary__cell">
          <span className="risk-summary__label">Reward / share</span>
          <span className="risk-summary__value risk-summary__value--good">
            {risk.rewardPerShare === null
              ? '—'
              : formatSignedCurrency(Math.abs(risk.rewardPerShare))}
          </span>
        </div>
        <div className="risk-summary__cell">
          <span className="risk-summary__label">Risk : Reward</span>
          <span className={`risk-summary__value risk-summary__value--${ratioTone}`}>
            {formatRatio(risk.riskRewardRatio)}
          </span>
        </div>
      </div>
    </div>
  )
}
