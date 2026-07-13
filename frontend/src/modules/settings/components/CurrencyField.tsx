import { formatCurrency } from '../../../shared/utils/format'
import { CURRENCY_OPTIONS } from '../utils/currencyOptions'
import './CurrencyField.css'

interface CurrencyFieldProps {
  value: string
  disabled: boolean
  onChange: (currency: string) => void
}

/** The amount shown in the preview — big enough to show off digit grouping, which is the
 * bit that actually differs between locales (₹1,23,456.78 vs $123,456.78). */
const PREVIEW_AMOUNT = 123456.78

/** Currency picker + a live preview of how amounts will read across the app. */
export function CurrencyField({ value, disabled, onChange }: CurrencyFieldProps) {
  return (
    <div className="currency-field">
      <label className="currency-field__label" htmlFor="currency">
        Currency
      </label>
      <p className="currency-field__hint">
        Every amount in the app — P&amp;L, prices, the equity curve, the report — is
        formatted in this currency.
      </p>

      <div className="currency-field__row">
        <select
          id="currency"
          className="currency-field__select"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
        >
          {CURRENCY_OPTIONS.map((option) => (
            <option key={option.currency} value={option.currency}>
              {option.symbol} · {option.label} ({option.currency})
            </option>
          ))}
        </select>

        <div className="currency-field__preview">
          <span className="currency-field__preview-label">Preview</span>
          <span className="currency-field__preview-value">{formatCurrency(PREVIEW_AMOUNT)}</span>
        </div>
      </div>
    </div>
  )
}
