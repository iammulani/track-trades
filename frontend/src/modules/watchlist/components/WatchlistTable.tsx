import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '../../../shared/components/Card'
import { Icon } from '../../../shared/components/Icon'
import { SideBadge } from '../../../shared/components/SideBadge'
import { avatarColor } from '../../../shared/utils/avatarColor'
import { formatDate, formatDateTime } from '../../../shared/utils/format'
import type { TradeDraft } from '../../drafts'
import type { ExitReason } from '../../exited-watchlist'
import { Code33Badge, type FundamentalsRecord } from '../../fundamentals'
import type {
  WatchCategory,
  WatchlistItemWithMetrics,
  WatchNote,
  WatchRating,
} from '../types/watchlistItem'
import { noteCount } from '../utils/notes'
import { itemRating } from '../utils/ratings'
import { CategorySelect } from './CategorySelect'
import { ExitWatchlistModal } from './ExitWatchlistModal'
import { NotesModal } from './NotesModal'
import { RatingStar } from './RatingStar'
import './WatchlistTable.css'

interface WatchlistTableProps {
  items: WatchlistItemWithMetrics[]
  /** Parked stepper runs, keyed by watchlist item id — a row with one resumes instead of starting over. */
  drafts: Record<string, TradeDraft>
  /** Quarterly fundamentals, keyed by watchlist item id — drives the Code 33 badge. */
  fundamentals: Record<string, FundamentalsRecord>
  onExit: (item: WatchlistItemWithMetrics, reason: ExitReason, note: string) => Promise<void>
  onUpdateCategory: (id: string, category: WatchCategory) => void
  onUpdateRating: (id: string, rating: WatchRating) => void
  onUpdateNotes: (id: string, notes: WatchNote[]) => Promise<void>
}

export function WatchlistTable({
  items,
  drafts,
  fundamentals,
  onExit,
  onUpdateCategory,
  onUpdateRating,
  onUpdateNotes,
}: WatchlistTableProps) {
  const [pending, setPending] = useState<WatchlistItemWithMetrics | null>(null)
  const [exiting, setExiting] = useState(false)
  const [notesFor, setNotesFor] = useState<WatchlistItemWithMetrics | null>(null)

  // The open item is re-read from `items` so a save's silent refetch flows straight
  // back into the popup instead of leaving it on a stale copy.
  const openNotesItem = notesFor ? (items.find((i) => i.id === notesFor.id) ?? null) : null

  return (
    <Card className="watch-table">
      <div className="watch-table__scroll">
        <table className="watch-table__table">
          <thead>
            <tr>
              <th className="ta-left"></th>
              <th className="ta-center">Side</th>
              <th className="ta-center">Since</th>
              <th className="ta-center watch-table__rating-head">Rating</th>
              <th className="ta-center watch-table__reason-head">Reason</th>
              <th className="ta-center">Notes</th>
              <th className="ta-center">Fundamentals</th>
              <th className="ta-right"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const draft = drafts[item.id]
              const notes = noteCount(item)
              return (
                <tr key={item.id}>
                  <td className="ta-left">
                    <div className="watch-table__stock">
                      <span
                        className="watch-table__avatar"
                        style={{ background: avatarColor(item.symbol) }}
                        aria-hidden="true"
                      >
                        {item.symbol.slice(0, 2)}
                      </span>
                      <span className="watch-table__symbol">{item.symbol}</span>
                      {draft && (
                        <span
                          className="watch-table__draft-pill"
                          title={`Draft saved ${formatDateTime(draft.updatedAt)}`}
                        >
                          Draft
                        </span>
                      )}
                      {item.link && (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="watch-table__link"
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
                  <td
                    className="ta-center watch-table__since"
                    title={formatDateTime(item.watchedSince)}
                  >
                    <div className="watch-table__duration">{item.watchedLabel}</div>
                    <div className="cell-time">{formatDate(item.watchedSince)}</div>
                  </td>
                  <td className="ta-center watch-table__rating">
                    <RatingStar
                      value={itemRating(item)}
                      symbol={item.symbol}
                      onChange={(rating) => onUpdateRating(item.id, rating)}
                    />
                  </td>
                  <td className="ta-center watch-table__reason">
                    <CategorySelect
                      value={item.category}
                      onChange={(category) => onUpdateCategory(item.id, category)}
                    />
                  </td>
                  <td className="ta-center watch-table__notes">
                    <button
                      type="button"
                      className={`watch-table__notes-btn${notes > 0 ? ' is-filled' : ''}`}
                      onClick={() => setNotesFor(item)}
                      aria-label={
                        notes > 0
                          ? `${notes} note${notes === 1 ? '' : 's'} for ${item.symbol}`
                          : `Add a note for ${item.symbol}`
                      }
                      title={notes > 0 ? 'View notes' : 'Add a note'}
                    >
                      <Icon name="note" size={15} />
                      {notes > 1 && <span className="watch-table__notes-count">{notes}</span>}
                    </button>
                  </td>
                  <td className="ta-center watch-table__fundamentals">
                    <Code33Badge
                      watchlistItemId={item.id}
                      symbol={item.symbol}
                      record={fundamentals[item.id]}
                    />
                  </td>
                  <td className="ta-right">
                    <div className="watch-table__actions">
                      <Link
                        to={`/watchlist/${item.id}/place-trade`}
                        className="watch-table__place-trade"
                        aria-label={
                          draft
                            ? `Resume the draft for ${item.symbol}`
                            : `Place trade for ${item.symbol}`
                        }
                        title={draft ? 'Resume draft' : 'Place trade'}
                      >
                        <Icon name={draft ? 'log' : 'send'} size={13} />
                        {draft ? 'Resume Draft' : 'Place Trade'}
                      </Link>
                      <button
                        type="button"
                        className="watch-table__remove"
                        onClick={() => setPending(item)}
                        aria-label={`Exit ${item.symbol} from watchlist`}
                        title="Exit watchlist"
                      >
                        <Icon name="x" size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <ExitWatchlistModal
        item={pending}
        exiting={exiting}
        onClose={() => setPending(null)}
        onExit={async (item, reason, note) => {
          setExiting(true)
          try {
            await onExit(item, reason, note)
            setPending(null)
          } finally {
            setExiting(false)
          }
        }}
      />

      <NotesModal
        item={openNotesItem}
        onSave={onUpdateNotes}
        onClose={() => setNotesFor(null)}
      />
    </Card>
  )
}
