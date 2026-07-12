import type { ChecklistChecked, IndicatorData } from '../types/placeTrade'
import { rsiTone } from '../utils/indicatorCalc'
import { INDICATOR_CHECKLIST_ITEMS } from '../utils/indicatorChecklistItems'
import { ChecklistStep } from './ChecklistStep'
import './TechnicalConfirmationStep.css'

interface TechnicalConfirmationStepProps {
  data: IndicatorData
  onChange: (data: IndicatorData) => void
  checklistChecked: ChecklistChecked
  onToggleChecklist: (id: string) => void
}

const RSI_NOTE =
  'The RSI is no less than 70, and preferably in the 80s & 90s, which will generally be the case with the better selections.'

export function TechnicalConfirmationStep({
  data,
  onChange,
  checklistChecked,
  onToggleChecklist,
}: TechnicalConfirmationStepProps) {
  function set<K extends keyof IndicatorData>(key: K, value: string) {
    onChange({ ...data, [key]: value })
  }

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

      <p className="technical-confirmation-step__intro">
        Capture the RSI reading on both timeframes.
      </p>
      <div className="technical-confirmation-step__grid">
        <label
          className={`technical-confirmation-step__field technical-confirmation-step__field--${rsiTone(data.weeklyRsi)}`}
        >
          <span className="technical-confirmation-step__label">Weekly RSI</span>
          <input
            type="number"
            min="0"
            max="100"
            step="1"
            className="technical-confirmation-step__input"
            value={data.weeklyRsi}
            onChange={(e) => set('weeklyRsi', e.target.value)}
            placeholder="0"
          />
        </label>
        <label
          className={`technical-confirmation-step__field technical-confirmation-step__field--${rsiTone(data.dailyRsi)}`}
        >
          <span className="technical-confirmation-step__label">Daily RSI</span>
          <input
            type="number"
            min="0"
            max="100"
            step="1"
            className="technical-confirmation-step__input"
            value={data.dailyRsi}
            onChange={(e) => set('dailyRsi', e.target.value)}
            placeholder="0"
          />
        </label>
      </div>
      <p className="technical-confirmation-step__note">{RSI_NOTE}</p>
    </div>
  )
}
