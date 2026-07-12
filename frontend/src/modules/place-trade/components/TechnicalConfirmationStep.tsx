import { Icon } from '../../../shared/components/Icon'
import { formatSignedPercent } from '../../../shared/utils/format'
import type { ChecklistChecked, IndicatorData } from '../types/placeTrade'
import { computeMaDistancePercent, maDistanceTone, rsiTone } from '../utils/indicatorCalc'
import { INDICATOR_CHECKLIST_ITEMS } from '../utils/indicatorChecklistItems'
import { ChecklistStep } from './ChecklistStep'
import './TechnicalConfirmationStep.css'

interface TechnicalConfirmationStepProps {
  entryPrice: string
  data: IndicatorData
  onChange: (data: IndicatorData) => void
  checklistChecked: ChecklistChecked
  onToggleChecklist: (id: string) => void
}

const RSI_NOTE =
  'The RSI is no less than 70, and preferably in the 80s & 90s, which will generally be the case with the better selections.'

const RSI_MIN = 50
const RSI_MAX = 90

export function TechnicalConfirmationStep({
  entryPrice,
  data,
  onChange,
  checklistChecked,
  onToggleChecklist,
}: TechnicalConfirmationStepProps) {
  function set<K extends keyof IndicatorData>(key: K, value: string) {
    onChange({ ...data, [key]: value })
  }

  const tone = rsiTone(data.rsi)
  const maDistance = computeMaDistancePercent(entryPrice, data.fiftyDayMa)
  const maTone = maDistanceTone(maDistance)
  const maAlert =
    maDistance !== null && (maTone === 'caution' || maTone === 'bad')
      ? maDistance < 0
        ? `Entry is ${formatSignedPercent(maDistance)} against the 50-day MA — below the fast average, so the short-term trend isn't confirmed.`
        : `Entry is ${formatSignedPercent(maDistance)} above the 50-day MA — getting extended; support is far below and your stop widens.`
      : null

  return (
    <div className="technical-confirmation-step">
      <p className="technical-confirmation-step__intro">
        Confirm the moving-average structure supports this trade.
      </p>
      <ChecklistStep
        items={INDICATOR_CHECKLIST_ITEMS}
        checked={checklistChecked}
        onToggle={onToggleChecklist}
      />

      <div className="technical-confirmation-step__divider" />

      <p className="technical-confirmation-step__intro">Capture the RSI reading.</p>
      <div className="technical-confirmation-step__rsi">
        <div className="technical-confirmation-step__rsi-header">
          <span className="technical-confirmation-step__label">RSI</span>
          <span className={`technical-confirmation-step__rsi-value technical-confirmation-step__rsi-value--${tone}`}>
            {data.rsi}
          </span>
        </div>
        <input
          type="range"
          min={RSI_MIN}
          max={RSI_MAX}
          step={1}
          className={`technical-confirmation-step__slider technical-confirmation-step__slider--${tone}`}
          value={data.rsi}
          onChange={(e) => set('rsi', e.target.value)}
        />
        <div className="technical-confirmation-step__rsi-scale">
          <span>{RSI_MIN}</span>
          <span>{RSI_MAX}</span>
        </div>
      </div>
      <p className="technical-confirmation-step__note">{RSI_NOTE}</p>

      <div className="technical-confirmation-step__divider" />

      <p className="technical-confirmation-step__intro">Capture the 50-day MA.</p>
      <div className="technical-confirmation-step__grid">
        <label className="technical-confirmation-step__field">
          <span className="technical-confirmation-step__label">50-day MA</span>
          <input
            type="number"
            step="0.01"
            className="technical-confirmation-step__input"
            value={data.fiftyDayMa}
            onChange={(e) => set('fiftyDayMa', e.target.value)}
            placeholder="0.00"
          />
        </label>
        <div className="technical-confirmation-step__ma-distance">
          <span className="technical-confirmation-step__label">From trading price</span>
          <span
            className={`technical-confirmation-step__ma-distance-value technical-confirmation-step__ma-distance-value--${maTone}`}
          >
            {maDistance === null ? '—' : formatSignedPercent(maDistance)}
          </span>
        </div>
      </div>
      {maAlert && (
        <p className={`technical-confirmation-step__ma-alert technical-confirmation-step__ma-alert--${maTone}`}>
          <Icon name="alert" size={15} />
          {maAlert}
        </p>
      )}
    </div>
  )
}
