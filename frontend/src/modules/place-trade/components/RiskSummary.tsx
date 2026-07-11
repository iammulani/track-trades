import { formatSignedCurrency } from '../../../shared/utils/format'
import type { WatchSide } from '../../watchlist'
import type { TradeParams } from '../types/placeTrade'
import { computeRisk } from '../utils/riskCalc'
import './RiskSummary.css'

interface RiskSummaryProps {
  side: WatchSide
  params: TradeParams
}

function formatRatio(ratio: number | null): string {
  return ratio === null ? '—' : `${ratio.toFixed(1)}R`
}

/** Live risk/reward, recomputed from entry/stop/target/size — nothing here is stored. */
export function RiskSummary({ side, params }: RiskSummaryProps) {
  const risk = computeRisk(side, params)
  const ratioTone =
    risk.riskRewardRatio !== null ? (risk.riskRewardRatio >= 2 ? 'good' : 'default') : 'default'

  return (
    <div className="risk-summary">
      <div className="risk-summary__cell">
        <span className="risk-summary__label">Risk / share</span>
        <span className="risk-summary__value">
          {risk.riskPerShare === null ? '—' : formatSignedCurrency(-Math.abs(risk.riskPerShare))}
        </span>
      </div>
      <div className="risk-summary__cell">
        <span className="risk-summary__label">Reward / share</span>
        <span className="risk-summary__value risk-summary__value--good">
          {risk.rewardPerShare === null ? '—' : formatSignedCurrency(Math.abs(risk.rewardPerShare))}
        </span>
      </div>
      <div className="risk-summary__cell">
        <span className="risk-summary__label">$ at risk</span>
        <span className="risk-summary__value risk-summary__value--critical">
          {risk.riskAmount === null ? '—' : formatSignedCurrency(-Math.abs(risk.riskAmount))}
        </span>
      </div>
      <div className="risk-summary__cell">
        <span className="risk-summary__label">$ potential</span>
        <span className="risk-summary__value risk-summary__value--good">
          {risk.rewardAmount === null ? '—' : formatSignedCurrency(Math.abs(risk.rewardAmount))}
        </span>
      </div>
      <div className="risk-summary__cell">
        <span className="risk-summary__label">Risk : Reward</span>
        <span className={`risk-summary__value risk-summary__value--${ratioTone}`}>
          {formatRatio(risk.riskRewardRatio)}
        </span>
      </div>
    </div>
  )
}
