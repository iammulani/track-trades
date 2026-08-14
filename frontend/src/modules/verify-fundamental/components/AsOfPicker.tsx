import { todayDateValue } from '../../../shared/utils/dateInput'
import { previousQuarterPeriod, quarterEndDateValue } from '../utils/previousQuarter'
import './AsOfPicker.css'

interface AsOfPickerProps {
  /** "YYYY-MM" (MM always one of 03/06/09/12), or '' if unset. */
  value: string
  onChange: (period: string) => void
}

/** A single date field — "as of" is expressed as any date, and the quarter it resolves to is
 * computed, never picked directly. */
export function AsOfPicker({ value, onChange }: AsOfPickerProps) {
  return (
    <input
      type="date"
      className="as-of-picker"
      value={value ? quarterEndDateValue(value) : ''}
      max={todayDateValue()}
      onChange={(e) => onChange(previousQuarterPeriod(e.target.value))}
    />
  )
}
