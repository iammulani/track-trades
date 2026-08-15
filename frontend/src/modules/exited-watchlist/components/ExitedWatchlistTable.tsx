import { useState } from 'react'
import { Card } from '../../../shared/components/Card'
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog'
import { HoverCard } from '../../../shared/components/HoverCard'
import { Icon } from '../../../shared/components/Icon'
import { RatingStars } from '../../../shared/components/RatingStars'
import { SideBadge } from '../../../shared/components/SideBadge'
import { avatarColor } from '../../../shared/utils/avatarColor'
import { formatDate, formatDateTime } from '../../../shared/utils/format'
import { code33Verdict, computeCode33 } from '../../fundamentals'
import { categoryMeta, itemNotes, itemRating } from '../../watchlist'
import type { ExitedWatchlistItem } from '../types/exitedWatchlistItem'
import { exitReasonLabel } from '../utils/exitReasons'
import { watchedDurationLabel } from '../utils/exitedMetrics'
import { ExitedFundamentalsModal } from './ExitedFundamentalsModal'
import { ExitedNotesModal } from './ExitedNotesModal'
import './ExitedWatchlistTable.css'

interface ExitedWatchlistTableProps {
  items: ExitedWatchlistItem[]
  onRemove: (id: string) => void
}

export function ExitedWatchlistTable({ items, onRemove }: ExitedWatchlistTableProps) {
  const [pending, setPending] = useState<ExitedWatchlistItem | null>(null)
  const [notesFor, setNotesFor] = useState<ExitedWatchlistItem | null>(null)
  const [fundamentalsFor, setFundamentalsFor] = useState<ExitedWatchlistItem | null>(null)

  return (
    <Card className="exited-table">
      <div className="exited-table__scroll">
        <table className="exited-table__table">
          <thead>
            <tr>
              <th className="ta-left"></th>
              <th className="ta-center">Side</th>
              <th className="ta-center">Category</th>
              <th className="ta-center">Watched</th>
              <th className="ta-center">Rating</th>
              <th className="ta-center">Notes</th>
              <th className="ta-center">Fundamentals</th>
              <th className="ta-center">Exit Reason</th>
              <th className="ta-center">Exit Note</th>
              <th className="ta-center">Exited</th>
              <th className="ta-right"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const meta = categoryMeta(item.category)
              const notes = itemNotes(item)
              const rating = itemRating(item)
              return (
                <tr key={item.id}>
                  <td className="ta-left">
                    <div className="exited-table__stock">
                      <span
                        className="exited-table__avatar"
                        style={{ background: avatarColor(item.symbol) }}
                        aria-hidden="true"
                      >
                        {item.symbol.slice(0, 2)}
                      </span>
                      <span className="exited-table__symbol">{item.symbol}</span>
                      {item.link && (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="exited-table__link"
                          aria-label={`Open link for ${item.symbol}`}
                          title={item.link}
                        >
                          <Icon name="link" size={13} />
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="ta-center">
                    <SideBadge side={item.side} />
                  </td>
                  <td className="ta-center">
                    <span
                      className={`exited-table__cat exited-table__cat--${meta.tone}`}
                      title={meta.label}
                    >
                      <Icon name={meta.icon} size={14} />
                    </span>
                  </td>
                  <td
                    className="ta-center exited-table__watched"
                    title={`${formatDateTime(item.watchedSince)} → ${formatDateTime(item.exitedAt)}`}
                  >
                    {watchedDurationLabel(item)}
                  </td>
                  <td className="ta-center">
                    {rating > 0 ? (
                      <RatingStars ratio={rating / 5} size={13} />
                    ) : (
                      <span className="exited-table__unrated">Unrated</span>
                    )}
                  </td>
                  <td className="ta-center">
                    {notes.length > 0 ? (
                      <button
                        type="button"
                        className="exited-table__notes-btn"
                        onClick={() => setNotesFor(item)}
                        aria-label={`${notes.length} note${notes.length === 1 ? '' : 's'} for ${item.symbol}`}
                        title="View notes"
                      >
                        <Icon name="note" size={14} />
                        {notes.length > 1 && notes.length}
                      </button>
                    ) : (
                      <span className="exited-table__no-notes" aria-hidden="true">
                        —
                      </span>
                    )}
                  </td>
                  <td className="ta-center">
                    {item.fundamentals && item.fundamentals.quarters.length > 0 ? (
                      <button
                        type="button"
                        className="exited-table__fundamentals-btn"
                        onClick={() => setFundamentalsFor(item)}
                        aria-label={`Fundamentals for ${item.symbol}`}
                        title={code33Verdict(computeCode33(item.fundamentals.quarters)).label}
                      >
                        <Icon name="bars" size={14} />
                      </button>
                    ) : (
                      <span className="exited-table__no-notes" aria-hidden="true">
                        —
                      </span>
                    )}
                  </td>
                  <td className="ta-center">
                    <span className="exited-table__reason">{exitReasonLabel(item.exitReason)}</span>
                  </td>
                  <td className="ta-center">
                    {item.exitNote ? (
                      <HoverCard
                        label={`Exit note for ${item.symbol}`}
                        triggerClassName="hover-card__trigger--plain exited-table__exit-note"
                        trigger={<Icon name="note" size={14} />}
                      >
                        <p className="exited-table__exit-note-panel">{item.exitNote}</p>
                      </HoverCard>
                    ) : (
                      <span className="exited-table__no-notes" aria-hidden="true">
                        —
                      </span>
                    )}
                  </td>
                  <td className="ta-center exited-table__exited" title={formatDateTime(item.exitedAt)}>
                    {formatDate(item.exitedAt)}
                  </td>
                  <td className="ta-right">
                    <button
                      type="button"
                      className="exited-table__remove"
                      onClick={() => setPending(item)}
                      aria-label={`Delete this exited ${item.symbol} entry`}
                      title="Delete entry"
                    >
                      <Icon name="x" size={14} />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={pending !== null}
        title="Delete this entry?"
        message={
          pending && (
            <div className="exited-remove-confirm">
              <span
                className="exited-remove-confirm__avatar"
                style={{ background: avatarColor(pending.symbol) }}
                aria-hidden="true"
              >
                {pending.symbol.slice(0, 2)}
              </span>
              <div>
                <div className="exited-remove-confirm__symbol">{pending.symbol}</div>
                <div className="exited-remove-confirm__note">
                  Permanently deletes this record from your Exited Watchlist. This can't be
                  undone.
                </div>
              </div>
            </div>
          )
        }
        confirmLabel="Delete"
        onCancel={() => setPending(null)}
        onConfirm={() => {
          if (pending) onRemove(pending.id)
          setPending(null)
        }}
      />

      <ExitedNotesModal item={notesFor} onClose={() => setNotesFor(null)} />
      <ExitedFundamentalsModal item={fundamentalsFor} onClose={() => setFundamentalsFor(null)} />
    </Card>
  )
}
