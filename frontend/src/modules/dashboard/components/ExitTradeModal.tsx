import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Icon } from '../../../shared/components/Icon'
import { Modal } from '../../../shared/components/Modal'
import { dateTimeLocalValueToIso, nowDateTimeLocalValue } from '../../../shared/utils/dateInput'
import { formatSignedCurrency, formatSignedPercent } from '../../../shared/utils/format'
import {
  computeExitPreview,
  EXIT_REASON_OPTIONS,
  MAX_EXIT_REASONS,
  type CloseTradeInput,
  type ExitReason,
  type TradeWithMetrics,
} from '../../trades'
import './ExitTradeModal.css'

interface ExitTradeModalProps {
  trade: TradeWithMetrics | null
  closing: boolean
  onExit: (id: string, input: CloseTradeInput) => Promise<void>
  onClose: () => void
}

/** A row while editing — the reason may still be unset. */
interface LearningRow {
  reason: ExitReason | ''
  note: string
}

const EMPTY_ROW: LearningRow = { reason: '', note: '' }

function formatRatio(ratio: number | null): string {
  return ratio === null ? '—' : `${ratio.toFixed(1)}R`
}

/** Popup for closing an open trade: exit date/time (defaults to now), exit price with a
 * live P&L / realized R-multiple preview, and up to `MAX_EXIT_REASONS` exit learnings —
 * each its own reason dropdown paired with its own note, since a trade can have several
 * independent takeaways rather than one shared explanation. */
export function ExitTradeModal({ trade, closing, onExit, onClose }: ExitTradeModalProps) {
  const [exitDateTime, setExitDateTime] = useState(nowDateTimeLocalValue)
  const [exitPrice, setExitPrice] = useState('')
  const [rows, setRows] = useState<LearningRow[]>([EMPTY_ROW])

  // Reset the form fresh each time a different trade is opened.
  useEffect(() => {
    if (trade) {
      setExitDateTime(nowDateTimeLocalValue())
      setExitPrice('')
      setRows([EMPTY_ROW])
    }
  }, [trade])

  const stopLoss = trade?.setup?.stopLoss ?? null
  const preview = trade
    ? computeExitPreview(trade, exitPrice, stopLoss)
    : { pnl: null, pnlPercent: null, riskRewardRatio: null }
  const pnlTone = preview.pnl === null ? '' : preview.pnl > 0 ? 'is-good' : preview.pnl < 0 ? 'is-critical' : ''

  function updateRow(index: number, patch: Partial<LearningRow>) {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  }

  function addRow() {
    setRows((prev) => (prev.length >= MAX_EXIT_REASONS ? prev : [...prev, EMPTY_ROW]))
  }

  function removeRow(index: number) {
    setRows((prev) => (prev.length <= 1 ? [EMPTY_ROW] : prev.filter((_, i) => i !== index)))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!trade || !exitPrice.trim() || !exitDateTime || closing) return
    const exitLearnings = rows
      .filter((row): row is { reason: ExitReason; note: string } => row.reason !== '')
      .slice(0, MAX_EXIT_REASONS)
      .map((row) => ({ reason: row.reason, note: row.note.trim() }))
    await onExit(trade.id, {
      exitPrice: Number(exitPrice),
      exitTime: dateTimeLocalValueToIso(exitDateTime),
      exitLearnings,
    })
    onClose()
  }

  return (
    <Modal open={trade !== null} onClose={onClose} width={680} labelledBy="exit-trade-title">
      {trade && (
        <form className="exit-modal__form" onSubmit={handleSubmit}>
          <h3 id="exit-trade-title" className="exit-modal__title">
            Exit {trade.symbol}
          </h3>

          <div className="exit-modal__row">
            <div className="exit-modal__field">
              <label className="exit-modal__label" htmlFor="exit-datetime">
                Exit date &amp; time
              </label>
              <input
                id="exit-datetime"
                type="datetime-local"
                className="exit-modal__input"
                value={exitDateTime}
                max={nowDateTimeLocalValue()}
                onChange={(e) => setExitDateTime(e.target.value)}
              />
            </div>

            <div className="exit-modal__field">
              <label className="exit-modal__label" htmlFor="exit-price">
                Exit price
              </label>
              <input
                id="exit-price"
                type="number"
                step="0.01"
                className="exit-modal__input"
                value={exitPrice}
                onChange={(e) => setExitPrice(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="exit-modal__preview">
            <div className="exit-modal__preview-cell">
              <span className="exit-modal__preview-label">Return</span>
              <span className={`exit-modal__preview-value ${pnlTone}`}>
                {preview.pnlPercent === null ? '—' : formatSignedPercent(preview.pnlPercent)}
              </span>
            </div>
            <div className="exit-modal__preview-cell">
              <span className="exit-modal__preview-label">P&amp;L</span>
              <span className={`exit-modal__preview-value ${pnlTone}`}>
                {preview.pnl === null ? '—' : formatSignedCurrency(preview.pnl)}
              </span>
            </div>
            <div className="exit-modal__preview-cell">
              <span className="exit-modal__preview-label">Risk : Reward</span>
              <span className="exit-modal__preview-value">{formatRatio(preview.riskRewardRatio)}</span>
            </div>
          </div>
          {stopLoss === null && (
            <p className="exit-modal__preview-note">
              No stop loss was captured for this trade, so the realized risk:reward can't be
              calculated.
            </p>
          )}

          <span className="exit-modal__label">
            Learnings{' '}
            <span className="exit-modal__optional">(optional, up to {MAX_EXIT_REASONS})</span>
          </span>
          <div className="exit-modal__learnings">
            {rows.map((row, i) => (
              <div className="exit-modal__learning" key={i}>
                <div className="exit-modal__learning-head">
                  <select
                    className="exit-modal__select"
                    aria-label={`Reason ${i + 1}`}
                    value={row.reason}
                    onChange={(e) => updateRow(i, { reason: e.target.value as ExitReason | '' })}
                  >
                    <option value="">— Select a reason —</option>
                    {EXIT_REASON_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  {rows.length > 1 && (
                    <button
                      type="button"
                      className="exit-modal__learning-remove"
                      onClick={() => removeRow(i)}
                      aria-label="Remove this learning"
                      title="Remove"
                    >
                      <Icon name="x" size={14} />
                    </button>
                  )}
                </div>
                <textarea
                  className="exit-modal__textarea"
                  aria-label={`Note for reason ${i + 1}`}
                  value={row.note}
                  onChange={(e) => updateRow(i, { note: e.target.value })}
                  placeholder="Note for this one — what happened, what you'd do differently…"
                  rows={3}
                  maxLength={500}
                />
              </div>
            ))}
          </div>
          {rows.length < MAX_EXIT_REASONS && (
            <button type="button" className="exit-modal__add-reason" onClick={addRow}>
              <Icon name="plus" size={13} />
              Add another learning
            </button>
          )}

          <div className="exit-modal__actions">
            <button type="button" className="exit-modal__cancel" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="exit-modal__submit"
              disabled={!exitPrice.trim() || closing}
            >
              <Icon name="check" size={16} />
              {closing ? 'Exiting…' : 'Exit Trade'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  )
}
