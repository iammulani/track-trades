import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Card } from '../../../shared/components/Card'
import { Icon } from '../../../shared/components/Icon'
import type { NewWatchlistItem, WatchCategory } from '../types/watchlistItem'
import { CATEGORIES } from '../utils/categories'
import './AddTickerForm.css'

interface AddTickerFormProps {
  adding: boolean
  onAdd: (input: NewWatchlistItem) => Promise<void>
  /** Pre-selects the category matching the currently active filter tab, if any. */
  defaultCategory?: WatchCategory
}

/** Add a symbol to the watchlist: ticker + why you're watching it. */
export function AddTickerForm({ adding, onAdd, defaultCategory }: AddTickerFormProps) {
  const [symbol, setSymbol] = useState('')
  const [category, setCategory] = useState<WatchCategory>(defaultCategory ?? 'daily')

  // Follow the active filter tab, so adding while filtered defaults sensibly.
  useEffect(() => {
    setCategory(defaultCategory ?? 'daily')
  }, [defaultCategory])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = symbol.trim()
    if (!trimmed || adding) return
    await onAdd({ symbol: trimmed, category })
    setSymbol('')
  }

  return (
    <Card className="add-ticker">
      <form className="add-ticker__form" onSubmit={handleSubmit}>
        <input
          className="add-ticker__input"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value.toUpperCase())}
          placeholder="Enter ticker, e.g. AAPL"
          maxLength={10}
          aria-label="Ticker symbol"
        />

        <div className="add-ticker__categories" role="radiogroup" aria-label="Watch reason">
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              type="button"
              role="radio"
              aria-checked={category === c.value}
              className={`add-ticker__cat${category === c.value ? ` is-active add-ticker__cat--${c.tone}` : ''}`}
              onClick={() => setCategory(c.value)}
              title={c.description}
            >
              {c.label}
            </button>
          ))}
        </div>

        <button type="submit" className="add-ticker__submit" disabled={!symbol.trim() || adding}>
          <Icon name="plus" size={16} />
          {adding ? 'Adding…' : 'Add'}
        </button>
      </form>
    </Card>
  )
}
