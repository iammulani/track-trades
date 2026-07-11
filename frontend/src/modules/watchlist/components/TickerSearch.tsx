import { Icon } from '../../../shared/components/Icon'
import './TickerSearch.css'

interface TickerSearchProps {
  value: string
  onChange: (value: string) => void
}

/** Client-side search — filters the visible watchlist by ticker as you type. */
export function TickerSearch({ value, onChange }: TickerSearchProps) {
  return (
    <div className="ticker-search">
      <Icon name="search" size={16} className="ticker-search__icon" />
      <input
        className="ticker-search__input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search ticker…"
        aria-label="Search watchlist by ticker"
      />
    </div>
  )
}
