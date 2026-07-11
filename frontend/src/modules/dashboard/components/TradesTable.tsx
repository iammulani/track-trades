import { Card } from '../../../shared/components/Card'
import { SideBadge } from '../../../shared/components/SideBadge'
import { avatarColor } from '../../../shared/utils/avatarColor'
import {
  formatDateTime,
  formatDuration,
  formatPrice,
  formatSignedCurrency,
  formatSignedPercent,
} from '../../../shared/utils/format'
import type { TradeWithMetrics } from '../../trades'
import { ResultBadge } from './ResultBadge'
import './TradesTable.css'

interface TradesTableProps {
  trades: TradeWithMetrics[]
}

function toneClass(value: number | null): string {
  if (value === null) return ''
  if (value > 0) return 'num--good'
  if (value < 0) return 'num--critical'
  return ''
}

/** The detail table: one row per trade, newest first. */
export function TradesTable({ trades }: TradesTableProps) {
  return (
    <Card className="trades">
      <div className="trades__head">
        <h3 className="trades__title">Recent trades</h3>
        <span className="trades__count">{trades.length} trades</span>
      </div>

      <div className="trades__scroll">
        <table className="trades__table">
          <thead>
            <tr>
              <th className="ta-left">Stock</th>
              <th className="ta-left">Side</th>
              <th className="ta-right">Qty</th>
              <th className="ta-left">Entry</th>
              <th className="ta-left">Exit</th>
              <th className="ta-right">Hold</th>
              <th className="ta-right">Return</th>
              <th className="ta-right">P&amp;L</th>
              <th className="ta-left">Result</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((t) => (
              <tr key={t.id}>
                <td className="ta-left">
                  <div className="trades__stock">
                    <span
                      className="trades__avatar"
                      style={{ background: avatarColor(t.symbol) }}
                      aria-hidden="true"
                    >
                      {t.symbol.slice(0, 2)}
                    </span>
                    <span className="trades__symbol">{t.symbol}</span>
                  </div>
                </td>
                <td className="ta-left">
                  <SideBadge side={t.side} />
                </td>
                <td className="ta-right num">{t.quantity}</td>
                <td className="ta-left">
                  <div className="cell-price">{formatPrice(t.entryPrice)}</div>
                  <div className="cell-time">{formatDateTime(t.entryTime)}</div>
                </td>
                <td className="ta-left">
                  {t.exitPrice !== null && t.exitTime !== null ? (
                    <>
                      <div className="cell-price">{formatPrice(t.exitPrice)}</div>
                      <div className="cell-time">{formatDateTime(t.exitTime)}</div>
                    </>
                  ) : (
                    <span className="cell-time">—</span>
                  )}
                </td>
                <td className="ta-right num">{formatDuration(t.metrics.durationMs)}</td>
                <td className={`ta-right num ${toneClass(t.metrics.pnlPercent)}`}>
                  {t.metrics.pnlPercent === null ? '—' : formatSignedPercent(t.metrics.pnlPercent)}
                </td>
                <td className={`ta-right num ${toneClass(t.metrics.pnl)}`}>
                  {t.metrics.pnl === null ? '—' : formatSignedCurrency(t.metrics.pnl)}
                </td>
                <td className="ta-left">
                  <ResultBadge outcome={t.metrics.outcome} status={t.metrics.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
