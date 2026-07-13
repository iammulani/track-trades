import { todayDateValue } from '../../../shared/utils/dateInput'
import type { WatchSide } from '../../watchlist'
import type { TradeParams } from '../types/placeTrade'
import { RiskSummary } from './RiskSummary'
import './TradeParamsStep.css'

interface TradeParamsStepProps {
  side: WatchSide
  params: TradeParams
  onChange: (params: TradeParams) => void
}

export function TradeParamsStep({ side, params, onChange }: TradeParamsStepProps) {
  function set<K extends keyof TradeParams>(key: K, value: string) {
    onChange({ ...params, [key]: value })
  }

  return (
    <div className="trade-params-step">
      <div className="trade-params-step__grid">
        <label className="trade-params-step__field">
          <span className="trade-params-step__label">Entry date</span>
          <input
            type="date"
            className="trade-params-step__input"
            value={params.entryDate}
            max={todayDateValue()}
            onChange={(e) => set('entryDate', e.target.value)}
          />
        </label>

        <label className="trade-params-step__field">
          <span className="trade-params-step__label">Entry price</span>
          <input
            type="number"
            step="0.01"
            className="trade-params-step__input"
            value={params.entryPrice}
            onChange={(e) => set('entryPrice', e.target.value)}
            placeholder="0.00"
          />
        </label>

        <label className="trade-params-step__field">
          <span className="trade-params-step__label">Quantity</span>
          <input
            type="number"
            step="1"
            className="trade-params-step__input"
            value={params.quantity}
            onChange={(e) => set('quantity', e.target.value)}
            placeholder="0"
          />
        </label>

        <label className="trade-params-step__field">
          <span className="trade-params-step__label">Stop loss</span>
          <input
            type="number"
            step="0.01"
            className="trade-params-step__input"
            value={params.stopLoss}
            onChange={(e) => set('stopLoss', e.target.value)}
            placeholder="0.00"
          />
        </label>

        <label className="trade-params-step__field">
          <span className="trade-params-step__label">
            Target <span className="trade-params-step__optional">(optional)</span>
          </span>
          <input
            type="number"
            step="0.01"
            className="trade-params-step__input"
            value={params.target}
            onChange={(e) => set('target', e.target.value)}
            placeholder="0.00"
          />
        </label>
      </div>

      <RiskSummary side={side} params={params} />
    </div>
  )
}
