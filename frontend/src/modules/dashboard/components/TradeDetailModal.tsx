import type { CSSProperties } from 'react'
import { Icon } from '../../../shared/components/Icon'
import { Modal } from '../../../shared/components/Modal'
import { SideBadge } from '../../../shared/components/SideBadge'
import { avatarColor } from '../../../shared/utils/avatarColor'
import {
  formatDateTime,
  formatDuration,
  formatPercent,
  formatPrice,
  formatSignedCurrency,
  formatSignedPercent,
} from '../../../shared/utils/format'
import {
  BASE_OPTIONS,
  BREAKOUT_CONFIRMATION_CHECKLIST_ITEMS,
  INDICATOR_CHECKLIST_ITEMS,
  OVERHEAD_SUPPLY_CHECKLIST_ITEMS,
  ratingVerdict,
  STAGE_OPTIONS,
} from '../../place-trade'
import type { TradeVcpContraction, TradeWithMetrics } from '../../trades'
import { ResultBadge } from './ResultBadge'
import './TradeDetailModal.css'

const RATING_STAR_COUNT = 7

interface TradeDetailModalProps {
  trade: TradeWithMetrics | null
  onClose: () => void
}

/** % pullback for one stored contraction — null only if `high` is 0 (shouldn't happen, but avoids a div/0). */
function contractionPercent(c: TradeVcpContraction): number | null {
  return c.high === 0 ? null : ((c.high - c.low) / c.high) * 100
}

function checklistCount(items: { id: string }[], checked: Record<string, boolean>): number {
  return items.filter((item) => checked[item.id]).length
}

/** Read-only detail popup for a past trade — shows the core fill data plus, when present,
 * the full setup captured by the place-trade stepper (stage/base, technicals, VCP, checklists,
 * and the rating as it stood at placement). Opened by clicking a row in `TradesTable`. */
export function TradeDetailModal({ trade, onClose }: TradeDetailModalProps) {
  const setup = trade?.setup
  const stage = setup?.stage ? STAGE_OPTIONS.find((s) => s.id === setup.stage) : undefined
  const base = setup?.base ? BASE_OPTIONS.find((b) => b.id === setup.base) : undefined
  const verdict =
    setup?.ratingRatio !== null && setup?.ratingRatio !== undefined
      ? ratingVerdict(setup.ratingRatio)
      : null
  const contractions = setup?.vcpContractions ?? []
  const percents = contractions
    .map(contractionPercent)
    .filter((p): p is number => p !== null)
  const largest = percents.length ? Math.max(...percents) : null
  const narrowest = percents.length ? Math.min(...percents) : null

  return (
    <Modal open={trade !== null} onClose={onClose} width={560} labelledBy="trade-detail-title">
      {trade && (
        <div className="trade-detail">
          <div className="trade-detail__header">
            <span
              className="trade-detail__avatar"
              style={{ background: avatarColor(trade.symbol) }}
              aria-hidden="true"
            >
              {trade.symbol.slice(0, 2)}
            </span>
            <div className="trade-detail__heading">
              <span id="trade-detail-title" className="trade-detail__symbol">
                {trade.symbol}
              </span>
              <div className="trade-detail__badges">
                <SideBadge side={trade.side} />
                <ResultBadge outcome={trade.metrics.outcome} status={trade.metrics.status} />
              </div>
            </div>
          </div>

          <div className="trade-detail__grid">
            <div className="trade-detail__stat">
              <span className="trade-detail__stat-label">Entry</span>
              <span className="trade-detail__stat-value">{formatPrice(trade.entryPrice)}</span>
              <span className="trade-detail__stat-sub">{formatDateTime(trade.entryTime)}</span>
            </div>
            <div className="trade-detail__stat">
              <span className="trade-detail__stat-label">Exit</span>
              {trade.exitPrice !== null && trade.exitTime !== null ? (
                <>
                  <span className="trade-detail__stat-value">{formatPrice(trade.exitPrice)}</span>
                  <span className="trade-detail__stat-sub">{formatDateTime(trade.exitTime)}</span>
                </>
              ) : (
                <span className="trade-detail__stat-value">Still open</span>
              )}
            </div>
            <div className="trade-detail__stat">
              <span className="trade-detail__stat-label">Quantity</span>
              <span className="trade-detail__stat-value">{trade.quantity}</span>
            </div>
            <div className="trade-detail__stat">
              <span className="trade-detail__stat-label">Hold</span>
              <span className="trade-detail__stat-value">
                {formatDuration(trade.metrics.durationMs)}
              </span>
            </div>
            <div className="trade-detail__stat">
              <span className="trade-detail__stat-label">Return</span>
              <span
                className={`trade-detail__stat-value ${
                  trade.metrics.pnlPercent === null
                    ? ''
                    : trade.metrics.pnlPercent > 0
                      ? 'is-good'
                      : trade.metrics.pnlPercent < 0
                        ? 'is-critical'
                        : ''
                }`}
              >
                {trade.metrics.pnlPercent === null ? '—' : formatSignedPercent(trade.metrics.pnlPercent)}
              </span>
            </div>
            <div className="trade-detail__stat">
              <span className="trade-detail__stat-label">P&amp;L</span>
              <span
                className={`trade-detail__stat-value ${
                  trade.metrics.pnl === null ? '' : trade.metrics.pnl > 0 ? 'is-good' : trade.metrics.pnl < 0 ? 'is-critical' : ''
                }`}
              >
                {trade.metrics.pnl === null ? '—' : formatSignedCurrency(trade.metrics.pnl)}
              </span>
            </div>
          </div>

          {trade.notes && <p className="trade-detail__notes">{trade.notes}</p>}

          {!setup && (
            <p className="trade-detail__no-setup">
              No setup captured for this trade — it predates that feature or was entered outside
              the Place Trade stepper.
            </p>
          )}

          {setup && (
            <>
              {verdict && (
                <div className={`trade-detail__rating trade-detail__rating--${verdict.tone}`}>
                  <span
                    className="trade-detail__rating-stars"
                    style={{ '--fill': `${(setup.ratingRatio ?? 0) * 100}%` } as CSSProperties}
                  >
                    <span className="trade-detail__rating-stars-track">
                      {Array.from({ length: RATING_STAR_COUNT }, (_, i) => (
                        <Icon key={i} name="star" size={18} />
                      ))}
                    </span>
                    <span className="trade-detail__rating-stars-fill" aria-hidden="true">
                      {Array.from({ length: RATING_STAR_COUNT }, (_, i) => (
                        <Icon key={i} name="star" size={18} />
                      ))}
                    </span>
                  </span>
                  <span className="trade-detail__rating-score">
                    {Math.round((setup.ratingRatio ?? 0) * 100)}%
                  </span>
                  <span className="trade-detail__rating-verdict">{verdict.label}</span>
                </div>
              )}

              <div className="trade-detail__section">
                <span className="trade-detail__section-title">Setup</span>
                <div className="trade-detail__grid">
                  <div className="trade-detail__stat">
                    <span className="trade-detail__stat-label">Watched for</span>
                    <span className="trade-detail__stat-value">
                      {setup.watchedSince
                        ? formatDuration(
                            new Date(trade.entryTime).getTime() - new Date(setup.watchedSince).getTime(),
                          )
                        : '—'}
                    </span>
                  </div>
                  <div className="trade-detail__stat">
                    <span className="trade-detail__stat-label">Stop loss</span>
                    <span className="trade-detail__stat-value">
                      {setup.stopLoss === null ? '—' : formatPrice(setup.stopLoss)}
                    </span>
                  </div>
                  <div className="trade-detail__stat">
                    <span className="trade-detail__stat-label">Target</span>
                    <span className="trade-detail__stat-value">
                      {setup.target === null ? '—' : formatPrice(setup.target)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="trade-detail__section">
                <span className="trade-detail__section-title">Stage &amp; Base</span>
                <div className="trade-detail__stage-base">
                  <div className="trade-detail__stage-base-item">
                    <span className="trade-detail__stage-base-label">Stage</span>
                    <span
                      className={`trade-detail__stage-base-value trade-detail__stage-base-value--${stage?.tone ?? 'none'}`}
                    >
                      {stage ? `${stage.label} — ${stage.verdict}` : '—'}
                    </span>
                  </div>
                  <div className="trade-detail__stage-base-item">
                    <span className="trade-detail__stage-base-label">Base</span>
                    <span
                      className={`trade-detail__stage-base-value trade-detail__stage-base-value--${base?.tone ?? 'none'}`}
                    >
                      {base ? `${base.label} — ${base.verdict}` : '—'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="trade-detail__section">
                <span className="trade-detail__section-title">
                  Technicals — {checklistCount(INDICATOR_CHECKLIST_ITEMS, setup.technicalChecklist)}/
                  {INDICATOR_CHECKLIST_ITEMS.length} confirmed
                </span>
                <div className="trade-detail__grid">
                  <div className="trade-detail__stat">
                    <span className="trade-detail__stat-label">RSI</span>
                    <span className="trade-detail__stat-value">{setup.rsi ?? '—'}</span>
                  </div>
                  <div className="trade-detail__stat">
                    <span className="trade-detail__stat-label">50-day MA</span>
                    <span className="trade-detail__stat-value">
                      {setup.fiftyDayMa === null ? '—' : formatPrice(setup.fiftyDayMa)}
                    </span>
                  </div>
                  <div className="trade-detail__stat">
                    <span className="trade-detail__stat-label">52-wk low</span>
                    <span className="trade-detail__stat-value">
                      {setup.week52Low === null ? '—' : formatPrice(setup.week52Low)}
                    </span>
                  </div>
                  <div className="trade-detail__stat">
                    <span className="trade-detail__stat-label">52-wk high</span>
                    <span className="trade-detail__stat-value">
                      {setup.week52High === null ? '—' : formatPrice(setup.week52High)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="trade-detail__section">
                <span className="trade-detail__section-title">
                  VCP Structure — {contractions.length} contraction{contractions.length === 1 ? '' : 's'}
                </span>
                <div className="trade-detail__grid">
                  <div className="trade-detail__stat">
                    <span className="trade-detail__stat-label">Weeks in base</span>
                    <span className="trade-detail__stat-value">{setup.weeksInBase ?? '—'}</span>
                  </div>
                  <div className="trade-detail__stat">
                    <span className="trade-detail__stat-label">Largest correction</span>
                    <span className="trade-detail__stat-value">
                      {largest === null ? '—' : formatPercent(largest)}
                    </span>
                  </div>
                  <div className="trade-detail__stat">
                    <span className="trade-detail__stat-label">Narrowest pullback</span>
                    <span className="trade-detail__stat-value">
                      {narrowest === null ? '—' : formatPercent(narrowest)}
                    </span>
                  </div>
                </div>
                {contractions.length > 0 && (
                  <ul className="trade-detail__contractions">
                    {contractions.map((c, i) => {
                      const pct = contractionPercent(c)
                      return (
                        <li key={i}>
                          <span className="trade-detail__contraction-label">T{i + 1}</span>
                          <span className="trade-detail__contraction-range">
                            {formatPrice(c.high)} → {formatPrice(c.low)}
                          </span>
                          <span className="trade-detail__contraction-pct">
                            {pct === null ? '—' : formatPercent(pct)}
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>

              <div className="trade-detail__section">
                <span className="trade-detail__section-title">
                  Overhead Supply — {checklistCount(OVERHEAD_SUPPLY_CHECKLIST_ITEMS, setup.finalChecks)}/
                  {OVERHEAD_SUPPLY_CHECKLIST_ITEMS.length} confirmed
                </span>
                <ul className="trade-detail__checklist">
                  {OVERHEAD_SUPPLY_CHECKLIST_ITEMS.map((c) => (
                    <li key={c.id} className={setup.finalChecks[c.id] ? 'is-checked' : 'is-unchecked'}>
                      {c.label}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="trade-detail__section">
                <span className="trade-detail__section-title">
                  Breakout Confirmation —{' '}
                  {checklistCount(BREAKOUT_CONFIRMATION_CHECKLIST_ITEMS, setup.finalChecks)}/
                  {BREAKOUT_CONFIRMATION_CHECKLIST_ITEMS.length} confirmed
                </span>
                <ul className="trade-detail__checklist">
                  {BREAKOUT_CONFIRMATION_CHECKLIST_ITEMS.map((c) => (
                    <li key={c.id} className={setup.finalChecks[c.id] ? 'is-checked' : 'is-unchecked'}>
                      {c.label}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      )}
    </Modal>
  )
}
