import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '../../../shared/components/Card'
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog'
import { Icon } from '../../../shared/components/Icon'
import { SideBadge } from '../../../shared/components/SideBadge'
import { avatarColor } from '../../../shared/utils/avatarColor'
import { formatDateTime } from '../../../shared/utils/format'
import type { WatchCategory, WatchlistItemWithMetrics } from '../types/watchlistItem'
import { CategorySelect } from './CategorySelect'
import './WatchlistTable.css'

interface WatchlistTableProps {
  items: WatchlistItemWithMetrics[]
  onRemove: (id: string) => void
  onUpdateCategory: (id: string, category: WatchCategory) => void
}

export function WatchlistTable({ items, onRemove, onUpdateCategory }: WatchlistTableProps) {
  const [pending, setPending] = useState<WatchlistItemWithMetrics | null>(null)

  return (
    <Card className="watch-table">
      <div className="watch-table__scroll">
        <table className="watch-table__table">
          <thead>
            <tr>
              <th className="ta-left">Stock</th>
              <th className="ta-left">Side</th>
              <th className="ta-left">Watching for</th>
              <th className="ta-left">Since</th>
              <th className="ta-left">Reason</th>
              <th className="ta-left">Notes</th>
              <th className="ta-right"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
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
                <td className="ta-left">
                  <SideBadge side={item.side} />
                </td>
                <td className="ta-left watch-table__duration">{item.watchedLabel}</td>
                <td className="ta-left cell-time">{formatDateTime(item.watchedSince)}</td>
                <td className="ta-left">
                  <CategorySelect
                    value={item.category}
                    onChange={(category) => onUpdateCategory(item.id, category)}
                  />
                </td>
                <td className="ta-left watch-table__notes">{item.notes || '—'}</td>
                <td className="ta-right">
                  <div className="watch-table__actions">
                    <Link
                      to={`/watchlist/${item.id}/place-trade`}
                      className="watch-table__place-trade"
                      aria-label={`Place trade for ${item.symbol}`}
                      title="Place trade"
                    >
                      <Icon name="send" size={13} />
                      Place Trade
                    </Link>
                    <button
                      type="button"
                      className="watch-table__remove"
                      onClick={() => setPending(item)}
                      aria-label={`Remove ${item.symbol} from watchlist`}
                      title="Remove"
                    >
                      <Icon name="x" size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={pending !== null}
        title="Remove from watchlist?"
        message={
          pending && (
            <div className="remove-confirm">
              <span
                className="remove-confirm__avatar"
                style={{ background: avatarColor(pending.symbol) }}
                aria-hidden="true"
              >
                {pending.symbol.slice(0, 2)}
              </span>
              <div>
                <div className="remove-confirm__symbol">{pending.symbol}</div>
                <div className="remove-confirm__note">
                  Will be removed from your watchlist. This can't be undone.
                </div>
              </div>
            </div>
          )
        }
        confirmLabel="Remove"
        onCancel={() => setPending(null)}
        onConfirm={() => {
          if (pending) onRemove(pending.id)
          setPending(null)
        }}
      />
    </Card>
  )
}
