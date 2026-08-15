import './AsOfYearPicker.css'

const CURRENT_YEAR = new Date().getFullYear()

interface AsOfYearPickerProps {
  /** "YYYY", or '' if unset. */
  value: string
  onChange: (year: string) => void
}

/** A plain fiscal-year picker — unlike `AsOfPicker`, a year needs no "resolve to the last closed
 * period" logic, since a typed year already is the reporting period. */
export function AsOfYearPicker({ value, onChange }: AsOfYearPickerProps) {
  return (
    <input
      type="number"
      className="as-of-year-picker"
      value={value}
      max={CURRENT_YEAR}
      step={1}
      onChange={(e) => {
        const next = e.target.value
        if (next === '') return
        onChange(String(Math.min(Number(next), CURRENT_YEAR)))
      }}
    />
  )
}
