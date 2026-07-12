import { formatPercent } from '../../../shared/utils/format'
import type { ChecklistChecked, IndicatorData } from '../types/placeTrade'
import { computeIndicatorRange, rsiTone } from '../utils/indicatorCalc'
import { INDICATOR_CHECKLIST_ITEMS } from '../utils/indicatorChecklistItems'
import { ChecklistStep } from './ChecklistStep'
import './IndicatorsStep.css'

interface IndicatorsStepProps {
  entryPrice: string
  data: IndicatorData
  onChange: (data: IndicatorData) => void
  checklistChecked: ChecklistChecked
  onToggleChecklist: (id: string) => void
}

const ABOVE_LOW_NOTE =
  "The current stock price is at least 30% above its 52-week low. (Many of the best selections will be 100%, 300%, or greater above their 52-week low before they emerge from a solid consolidation period and mount a large scale advance.)"

const BELOW_HIGH_NOTE =
  "The current stock price is within at least 25% of its 52-week high (the closer to a new high the better)."

const RSI_NOTE =
  'The RSI is no less than 70, and preferably in the 80s & 90s, which will generally be the case with the better selections.'

export function IndicatorsStep({
  entryPrice,
  data,
  onChange,
  checklistChecked,
  onToggleChecklist,
}: IndicatorsStepProps) {
  function set<K extends keyof IndicatorData>(key: K, value: string) {
    onChange({ ...data, [key]: value })
  }

  const range = computeIndicatorRange(entryPrice, data.week52Low, data.week52High)
  const aboveLowTone =
    range.aboveLowPercent === null ? 'none' : range.aboveLowPercent >= 30 ? 'good' : 'bad'
  const belowHighTone =
    range.belowHighPercent === null ? 'none' : range.belowHighPercent <= 25 ? 'good' : 'bad'

  return (
    <div className="indicators-step">
      <section className="indicators-step__section">
        <div className="indicators-step__section-header">
          <h3>Technical confirmation</h3>
          <p>Confirm the moving-average structure and momentum support this trade.</p>
        </div>
        <ChecklistStep
          items={INDICATOR_CHECKLIST_ITEMS}
          checked={checklistChecked}
          onToggle={onToggleChecklist}
        />

        <div className="indicators-step__divider" />

        <div className="indicators-step__grid">
          <label className={`indicators-step__field indicators-step__field--${rsiTone(data.weeklyRsi)}`}>
            <span className="indicators-step__label">Weekly RSI</span>
            <input
              type="number"
              min="0"
              max="100"
              step="1"
              className="indicators-step__input"
              value={data.weeklyRsi}
              onChange={(e) => set('weeklyRsi', e.target.value)}
              placeholder="0"
            />
          </label>
          <label className={`indicators-step__field indicators-step__field--${rsiTone(data.dailyRsi)}`}>
            <span className="indicators-step__label">Daily RSI</span>
            <input
              type="number"
              min="0"
              max="100"
              step="1"
              className="indicators-step__input"
              value={data.dailyRsi}
              onChange={(e) => set('dailyRsi', e.target.value)}
              placeholder="0"
            />
          </label>
        </div>
        <p className="indicators-step__note">{RSI_NOTE}</p>
      </section>

      <section className="indicators-step__section">
        <div className="indicators-step__section-header">
          <h3>52-week range</h3>
          <p>Where does the entry price sit relative to the 52-week range?</p>
        </div>
        <div className="indicators-step__grid">
          <label className="indicators-step__field">
            <span className="indicators-step__label">52-week low</span>
            <input
              type="number"
              step="0.01"
              className="indicators-step__input"
              value={data.week52Low}
              onChange={(e) => set('week52Low', e.target.value)}
              placeholder="0.00"
            />
          </label>
          <label className="indicators-step__field">
            <span className="indicators-step__label">52-week high</span>
            <input
              type="number"
              step="0.01"
              className="indicators-step__input"
              value={data.week52High}
              onChange={(e) => set('week52High', e.target.value)}
              placeholder="0.00"
            />
          </label>
        </div>

        <div className="indicators-step__hero">
          <div className={`indicators-step__hero-cell indicators-step__hero-cell--${aboveLowTone}`}>
            <span className="indicators-step__hero-label">Above 52-week low</span>
            <span className="indicators-step__hero-value">
              {range.aboveLowPercent === null ? '—' : formatPercent(range.aboveLowPercent)}
            </span>
            <p className="indicators-step__hero-note">{ABOVE_LOW_NOTE}</p>
          </div>
          <div className={`indicators-step__hero-cell indicators-step__hero-cell--${belowHighTone}`}>
            <span className="indicators-step__hero-label">Below 52-week high</span>
            <span className="indicators-step__hero-value">
              {range.belowHighPercent === null ? '—' : formatPercent(range.belowHighPercent)}
            </span>
            <p className="indicators-step__hero-note">{BELOW_HIGH_NOTE}</p>
          </div>
        </div>
      </section>
    </div>
  )
}
