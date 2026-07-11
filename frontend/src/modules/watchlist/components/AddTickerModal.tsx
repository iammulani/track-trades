import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Icon } from '../../../shared/components/Icon'
import { Modal } from '../../../shared/components/Modal'
import type {
  NewWatchlistItem,
  WatchCategory,
  WatchlistItemWithMetrics,
  WatchSide,
} from '../types/watchlistItem'
import { CATEGORIES, categoryMeta } from '../utils/categories'
import './AddTickerModal.css'

interface AddTickerModalProps {
  open: boolean
  items: WatchlistItemWithMetrics[]
  adding: boolean
  defaultCategory?: WatchCategory
  onAdd: (input: NewWatchlistItem) => Promise<void>
  onClose: () => void
}

/** Popup for adding a ticker: symbol, long/short bias, why, and a note. Warns on duplicates. */
export function AddTickerModal({
  open,
  items,
  adding,
  defaultCategory,
  onAdd,
  onClose,
}: AddTickerModalProps) {
  const [symbol, setSymbol] = useState('')
  const [side, setSide] = useState<WatchSide>('long')
  const [category, setCategory] = useState<WatchCategory>(defaultCategory ?? 'daily')
  const [notes, setNotes] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Reset the form fresh each time the popup opens, and focus the ticker input.
  useEffect(() => {
    if (open) {
      setSymbol('')
      setSide('long')
      setCategory(defaultCategory ?? 'daily')
      setNotes('')
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open, defaultCategory])

  const trimmed = symbol.trim()
  const duplicate = trimmed
    ? items.find((item) => item.symbol === trimmed.toUpperCase())
    : undefined

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!trimmed || duplicate || adding) return
    await onAdd({ symbol: trimmed, category, side, notes: notes.trim() })
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} width={440} labelledBy="add-ticker-title">
      <h3 id="add-ticker-title" className="add-modal__title">
        Add to watchlist
      </h3>

      <form className="add-modal__form" onSubmit={handleSubmit}>
        <label className="add-modal__label" htmlFor="add-ticker-input">
          Ticker
        </label>
        <input
          id="add-ticker-input"
          ref={inputRef}
          className="add-modal__input"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value.toUpperCase())}
          placeholder="e.g. AAPL"
          maxLength={10}
        />

        {duplicate && (
          <p className="add-modal__warning">
            <Icon name="alert" size={14} />
            {duplicate.symbol} is already on your watchlist, under{' '}
            <strong>{categoryMeta(duplicate.category).label}</strong>. Change its category from the
            table instead of adding it again.
          </p>
        )}

        <span className="add-modal__label">Watching for</span>
        <div className="add-modal__side" role="radiogroup" aria-label="Long or short">
          <button
            type="button"
            role="radio"
            aria-checked={side === 'long'}
            className={`add-modal__side-btn${side === 'long' ? ' is-active add-modal__side-btn--long' : ''}`}
            onClick={() => setSide('long')}
          >
            Long
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={side === 'short'}
            className={`add-modal__side-btn${side === 'short' ? ' is-active add-modal__side-btn--short' : ''}`}
            onClick={() => setSide('short')}
          >
            Short
          </button>
        </div>

        <span className="add-modal__label">Why are you watching it?</span>
        <div className="add-modal__categories" role="radiogroup" aria-label="Watch reason">
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              type="button"
              role="radio"
              aria-checked={category === c.value}
              className={`add-modal__cat${category === c.value ? ` is-active add-modal__cat--${c.tone}` : ''}`}
              onClick={() => setCategory(c.value)}
              title={c.description}
            >
              {c.label}
            </button>
          ))}
        </div>

        <label className="add-modal__label" htmlFor="add-ticker-notes">
          Note <span className="add-modal__optional">(optional)</span>
        </label>
        <textarea
          id="add-ticker-notes"
          className="add-modal__textarea"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="What's the setup? What are you waiting for?"
          rows={3}
          maxLength={280}
        />

        <div className="add-modal__actions">
          <button type="button" className="add-modal__cancel" onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            className="add-modal__submit"
            disabled={!trimmed || !!duplicate || adding}
          >
            <Icon name="plus" size={16} />
            {adding ? 'Adding…' : 'Add'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
