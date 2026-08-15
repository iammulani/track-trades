import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { EXIT_REASONS, type ExitReason } from '../../exited-watchlist'
import { Modal } from '../../../shared/components/Modal'
import { avatarColor } from '../../../shared/utils/avatarColor'
import type { WatchlistItemWithMetrics } from '../types/watchlistItem'
import './ExitWatchlistModal.css'

interface ExitWatchlistModalProps {
  /** The item being exited — `null` keeps the popup closed. */
  item: WatchlistItemWithMetrics | null
  exiting: boolean
  onExit: (item: WatchlistItemWithMetrics, reason: ExitReason, note: string) => Promise<void>
  onClose: () => void
}

/** Confirms removing a symbol from the active watchlist by capturing why — a required
 * reason and an optional note — before it's archived into the Exited Watchlist. */
export function ExitWatchlistModal({ item, exiting, onExit, onClose }: ExitWatchlistModalProps) {
  const [reason, setReason] = useState<ExitReason | ''>('')
  const [note, setNote] = useState('')

  // Fresh state every time a different symbol is up for exit.
  useEffect(() => {
    if (item) {
      setReason('')
      setNote('')
    }
  }, [item])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!item || !reason || exiting) return
    await onExit(item, reason, note)
  }

  return (
    <Modal open={item !== null} onClose={onClose} width={420} labelledBy="exit-watchlist-title">
      {item && (
        <form className="exit-watch-modal" onSubmit={handleSubmit}>
          <div className="exit-watch-modal__head">
            <span
              className="exit-watch-modal__avatar"
              style={{ background: avatarColor(item.symbol) }}
              aria-hidden="true"
            >
              {item.symbol.slice(0, 2)}
            </span>
            <div>
              <h3 id="exit-watchlist-title" className="exit-watch-modal__symbol">
                {item.symbol}
              </h3>
              <p className="exit-watch-modal__sub">
                Removed from your watchlist and moved to Exited Watchlist.
              </p>
            </div>
          </div>

          <label className="exit-watch-modal__label" htmlFor="exit-watch-reason">
            Reason
          </label>
          <select
            id="exit-watch-reason"
            className="exit-watch-modal__select"
            value={reason}
            onChange={(e) => setReason(e.target.value as ExitReason)}
            required
          >
            <option value="" disabled>
              Select a reason…
            </option>
            {EXIT_REASONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>

          <label className="exit-watch-modal__label" htmlFor="exit-watch-note">
            Note <span className="exit-watch-modal__optional">(optional)</span>
          </label>
          <textarea
            id="exit-watch-note"
            className="exit-watch-modal__textarea"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Anything worth remembering about why this didn't work out?"
            rows={3}
            maxLength={280}
          />

          <div className="exit-watch-modal__actions">
            <button type="button" className="exit-watch-modal__cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="exit-watch-modal__submit" disabled={!reason || exiting}>
              {exiting ? 'Exiting…' : 'Exit watchlist'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  )
}
