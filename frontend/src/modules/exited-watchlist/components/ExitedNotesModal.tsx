import { Modal } from '../../../shared/components/Modal'
import { avatarColor } from '../../../shared/utils/avatarColor'
import { formatDate } from '../../../shared/utils/format'
import { itemNotes } from '../../watchlist'
import type { ExitedWatchlistItem } from '../types/exitedWatchlistItem'
import './ExitedNotesModal.css'

interface ExitedNotesModalProps {
  /** The item whose log is open — `null` keeps the popup closed. */
  item: ExitedWatchlistItem | null
  onClose: () => void
}

/** Read-only view of the dated notes log carried over from the watchlist item — same
 * entries `NotesModal` shows live, but frozen: no composer, no edit, no delete. */
export function ExitedNotesModal({ item, onClose }: ExitedNotesModalProps) {
  const notes = item ? itemNotes(item) : []

  return (
    <Modal open={item !== null} onClose={onClose} width={480} labelledBy="exited-notes-title">
      {item && (
        <>
          <div className="exited-notes-modal__head">
            <span
              className="exited-notes-modal__avatar"
              style={{ background: avatarColor(item.symbol) }}
              aria-hidden="true"
            >
              {item.symbol.slice(0, 2)}
            </span>
            <div>
              <h3 id="exited-notes-title" className="exited-notes-modal__symbol">
                {item.symbol}
              </h3>
              <p className="exited-notes-modal__sub">
                {notes.length} note{notes.length === 1 ? '' : 's'} from when this was on your
                watchlist
              </p>
            </div>
          </div>

          <ul className="exited-notes-modal__list">
            {notes.map((note) => (
              <li key={note.id} className="exited-notes-modal__entry">
                <p className="exited-notes-modal__text">
                  <span className="exited-notes-modal__date">{formatDate(note.date)}</span>
                  <span className="exited-notes-modal__dash"> — </span>
                  {note.text}
                </p>
                {note.conclusion && (
                  <p className="exited-notes-modal__conclusion">{note.conclusion}</p>
                )}
                {note.editedAt && (
                  <p className="exited-notes-modal__edited">edited {formatDate(note.editedAt)}</p>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </Modal>
  )
}
