import { formatPercent } from '../../../shared/utils/format'
import type { IndicatorData } from '../types/placeTrade'
import { computeIndicatorRange } from '../utils/indicatorCalc'
import './WeekRangeStep.css'

interface WeekRangeStepProps {
  entryPrice: string
  data: IndicatorData
  onChange: (data: IndicatorData) => void
}

const ABOVE_LOW_NOTE =
  "The current stock price is at least 30% above its 52-week low. (Many of the best selections will be 100%, 300%, or greater above their 52-week low before they emerge from a solid consolidation period and mount a large scale advance.)"

const BELOW_HIGH_NOTE =
  "The current stock price is within at least 25% of its 52-week high (the closer to a new high the better)."

export function WeekRangeStep({ entryPrice, data, onChange }: WeekRangeStepProps) {
  function set<K extends keyof IndicatorData>(key: K, value: string) {
    onChange({ ...data, [key]: value })
  }

  const range = computeIndicatorRange(entryPrice, data.week52Low, data.week52High)
  const aboveLowTone =
    range.aboveLowPercent === null ? 'none' : range.aboveLowPercent >= 30 ? 'good' : 'bad'
  const belowHighTone =
    range.belowHighPercent === null ? 'none' : range.belowHighPercent <= 25 ? 'good' : 'bad'

  return (
    <div className="week-range-step">
      <p className="week-range-step__intro">
        Where does the entry price sit relative to the 52-week range?
      </p>
      <div className="week-range-step__grid">
        <label className="week-range-step__field">
          <span className="week-range-step__label">52-week low</span>
          <input
            type="number"
            step="0.01"
            className="week-range-step__input"
            value={data.week52Low}
            onChange={(e) => set('week52Low', e.target.value)}
            placeholder="0.00"
          />
        </label>
        <label className="week-range-step__field">
          <span className="week-range-step__label">52-week high</span>
          <input
            type="number"
            step="0.01"
            className="week-range-step__input"
            value={data.week52High}
            onChange={(e) => set('week52High', e.target.value)}
            placeholder="0.00"
          />
        </label>
      </div>

      <div className="week-range-step__hero">
        <div className={`week-range-step__hero-cell week-range-step__hero-cell--${aboveLowTone}`}>
          <span className="week-range-step__hero-label">Above 52-week low</span>
          <span className="week-range-step__hero-value">
            {range.aboveLowPercent === null ? '—' : formatPercent(range.aboveLowPercent)}
          </span>
          <p className="week-range-step__hero-note">{ABOVE_LOW_NOTE}</p>
        </div>
        <div className={`week-range-step__hero-cell week-range-step__hero-cell--${belowHighTone}`}>
          <span className="week-range-step__hero-label">Below 52-week high</span>
          <span className="week-range-step__hero-value">
            {range.belowHighPercent === null ? '—' : formatPercent(range.belowHighPercent)}
          </span>
          <p className="week-range-step__hero-note">{BELOW_HIGH_NOTE}</p>
        </div>
      </div>
    </div>
  )
}
