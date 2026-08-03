import { useEffect, useRef, useState } from 'react'
import { Icon } from '../../../shared/components/Icon'
import { Modal } from '../../../shared/components/Modal'
import { avatarColor } from '../../../shared/utils/avatarColor'
import { dateValueToIso, todayDateValue } from '../../../shared/utils/dateInput'
import { formatDate } from '../../../shared/utils/format'
import type { WatchlistItemWithMetrics, WatchNote } from '../types/watchlistItem'
import { itemNotes, makeNote } from '../utils/notes'
import './NotesModal.css'

interface NotesModalProps {
  /** The item whose log is open — `null` keeps the popup closed. */
  item: WatchlistItemWithMetrics | null
  onSave: (id: string, notes: WatchNote[]) => Promise<void>
  onClose: () => void
}

/** The dated notes log for one symbol: compose at the top, entries newest-first below,
 * each one editable or deletable however old it is. */
export function NotesModal({ item, onSave, onClose }: NotesModalProps) {
  const [draft, setDraft] = useState('')
  const [draftConclusion, setDraftConclusion] = useState('')
  const [draftDate, setDraftDate] = useState(todayDateValue)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [editConclusion, setEditConclusion] = useState('')
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const composerRef = useRef<HTMLTextAreaElement>(null)

  // Fresh composer every time a different symbol's log is opened — keyed on the id
  // alone, so a save's refetch swapping in a new object doesn't wipe what's typed.
  const itemId = item?.id
  useEffect(() => {
    if (!itemId) return
    setDraft('')
    setDraftConclusion('')
    setDraftDate(todayDateValue())
    setEditingId(null)
    setConfirmingId(null)
    requestAnimationFrame(() => composerRef.current?.focus())
  }, [itemId])

  const notes = item ? itemNotes(item) : []

  async function commit(next: WatchNote[]) {
    if (!item) return
    setSaving(true)
    try {
      await onSave(item.id, next)
    } finally {
      setSaving(false)
    }
  }

  async function handleAdd() {
    const text = draft.trim()
    if (!text || saving) return
    await commit([makeNote(text, dateValueToIso(draftDate), draftConclusion), ...notes])
    setDraft('')
    setDraftConclusion('')
    setDraftDate(todayDateValue())
  }

  async function handleEditSave(note: WatchNote) {
    const text = editText.trim()
    if (!text || saving) return
    const conclusion = editConclusion.trim()
    setEditingId(null)
    // Nothing actually changed isn't an edit — don't stamp it as one.
    if (text === note.text && conclusion === (note.conclusion ?? '')) return
    await commit(
      notes.map((n) => {
        if (n.id !== note.id) return n
        const next: WatchNote = { ...n, text, editedAt: new Date().toISOString() }
        if (conclusion) next.conclusion = conclusion
        else delete next.conclusion
        return next
      }),
    )
  }

  async function handleDelete(id: string) {
    setConfirmingId(null)
    await commit(notes.filter((n) => n.id !== id))
  }

  return (
    <Modal open={item !== null} onClose={onClose} width={520} labelledBy="notes-modal-title">
      {item && (
        <>
          <div className="notes-modal__head">
            <span
              className="notes-modal__avatar"
              style={{ background: avatarColor(item.symbol) }}
              aria-hidden="true"
            >
              {item.symbol.slice(0, 2)}
            </span>
            <div>
              <h3 id="notes-modal-title" className="notes-modal__symbol">
                {item.symbol}
              </h3>
              <p className="notes-modal__sub">
                {notes.length === 0
                  ? 'No notes yet'
                  : `${notes.length} note${notes.length === 1 ? '' : 's'}`}
              </p>
            </div>
            <button
              type="button"
              className="notes-modal__close"
              onClick={onClose}
              aria-label="Close notes"
            >
              <Icon name="x" size={16} />
            </button>
          </div>

          <div className="notes-modal__composer">
            <textarea
              ref={composerRef}
              className="notes-modal__textarea"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="What happened? The event, the price action, the numbers."
              rows={3}
            />
            <textarea
              className="notes-modal__textarea notes-modal__textarea--conclusion"
              value={draftConclusion}
              onChange={(e) => setDraftConclusion(e.target.value)}
              placeholder="Your read on it (optional) — what it means for the setup."
              rows={2}
            />
            <div className="notes-modal__composer-row">
              <label className="notes-modal__date-label" htmlFor="notes-modal-date">
                Dated
              </label>
              <input
                id="notes-modal-date"
                type="date"
                className="notes-modal__date"
                value={draftDate}
                max={todayDateValue()}
                onChange={(e) => setDraftDate(e.target.value)}
              />
              <button
                type="button"
                className="notes-modal__add"
                onClick={handleAdd}
                disabled={!draft.trim() || saving}
              >
                <Icon name="plus" size={15} />
                {saving ? 'Saving…' : 'Add note'}
              </button>
            </div>
          </div>

          {notes.length === 0 ? (
            <p className="notes-modal__empty">No notes yet. Add the first one above.</p>
          ) : (
            <ul className="notes-modal__list">
              {notes.map((note) => (
                <li key={note.id} className="notes-modal__entry">
                  {confirmingId !== note.id && editingId !== note.id && (
                    <div className="notes-modal__entry-actions">
                      <button
                        type="button"
                        className="notes-modal__icon-btn"
                        onClick={() => {
                          setEditingId(note.id)
                          setEditText(note.text)
                          setEditConclusion(note.conclusion ?? '')
                        }}
                        aria-label={`Edit the note from ${formatDate(note.date)}`}
                        title="Edit"
                      >
                        <Icon name="pencil" size={14} />
                      </button>
                      <button
                        type="button"
                        className="notes-modal__icon-btn notes-modal__icon-btn--danger"
                        onClick={() => setConfirmingId(note.id)}
                        aria-label={`Delete the note from ${formatDate(note.date)}`}
                        title="Delete"
                      >
                        <Icon name="x" size={14} />
                      </button>
                    </div>
                  )}

                  {editingId === note.id ? (
                    <>
                      <p className="notes-modal__editing-date">{formatDate(note.date)}</p>
                      <textarea
                        className="notes-modal__textarea"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        rows={3}
                        autoFocus
                      />
                      <textarea
                        className="notes-modal__textarea notes-modal__textarea--conclusion"
                        value={editConclusion}
                        onChange={(e) => setEditConclusion(e.target.value)}
                        placeholder="Your read on it (optional)"
                        rows={2}
                      />
                      <div className="notes-modal__inline-actions">
                        <button
                          type="button"
                          className="notes-modal__ghost"
                          onClick={() => setEditingId(null)}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="notes-modal__add"
                          onClick={() => handleEditSave(note)}
                          disabled={!editText.trim() || saving}
                        >
                          Save
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="notes-modal__text">
                        <span className="notes-modal__entry-date">{formatDate(note.date)}</span>
                        <span className="notes-modal__dash"> — </span>
                        {note.text}
                      </p>
                      {note.conclusion && (
                        <p className="notes-modal__conclusion">{note.conclusion}</p>
                      )}
                      {note.editedAt && (
                        <p className="notes-modal__edited">edited {formatDate(note.editedAt)}</p>
                      )}
                    </>
                  )}

                  {confirmingId === note.id && (
                    <div className="notes-modal__confirm">
                      <span>Delete this note?</span>
                      <button
                        type="button"
                        className="notes-modal__ghost"
                        onClick={() => setConfirmingId(null)}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="notes-modal__danger"
                        onClick={() => handleDelete(note.id)}
                        disabled={saving}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </Modal>
  )
}
