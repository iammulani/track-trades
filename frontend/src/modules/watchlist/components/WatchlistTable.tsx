import { Card } from '../../../shared/components/Card'
import { Icon } from '../../../shared/components/Icon'
import { avatarColor } from '../../../shared/utils/avatarColor'
import { formatDateTime } from '../../../shared/utils/format'
import type { WatchlistItemWithMetrics } from '../types/watchlistItem'
import { CategoryBadge } from './CategoryBadge'
import './WatchlistTable.css'

interface WatchlistTableProps {
  items: WatchlistItemWithMetrics[]
  onRemove: (id: string) => void
}

export function WatchlistTable({ items, onRemove }: WatchlistTableProps) {
  return (
    <Card className="watch-table">
      <div className="watch-table__scroll">
        <table className="watch-table__table">
          <thead>
            <tr>
              <th className="ta-left">Stock</th>
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
                  </div>
                </td>
                <td className="ta-left watch-table__duration">{item.watchedLabel}</td>
                <td className="ta-left cell-time">{formatDateTime(item.watchedSince)}</td>
                <td className="ta-left">
                  <CategoryBadge category={item.category} />
                </td>
                <td className="ta-left watch-table__notes">{item.notes || '—'}</td>
                <td className="ta-right">
                  <button
                    type="button"
                    className="watch-table__remove"
                    onClick={() => onRemove(item.id)}
                    aria-label={`Remove ${item.symbol} from watchlist`}
                    title="Remove"
                  >
                    <Icon name="x" size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
