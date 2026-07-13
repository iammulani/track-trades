import type { CSSProperties } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Card } from '../../shared/components/Card'
import { Icon } from '../../shared/components/Icon'
import { PageHeader } from '../../shared/components/PageHeader'
import { ResultBadge } from '../../shared/components/ResultBadge'
import { SideBadge } from '../../shared/components/SideBadge'
import { avatarColor } from '../../shared/utils/avatarColor'
import {
  formatDateTime,
  formatDuration,
  formatPercent,
  formatPrice,
  formatSignedCurrency,
  formatSignedPercent,
} from '../../shared/utils/format'
import {
  BASE_OPTIONS,
  BREAKOUT_CONFIRMATION_CHECKLIST_ITEMS,
  computeTradeRating,
  criterionPoints,
  criterionState,
  CRITERION_STATE_ICON,
  formatPoints,
  INDICATOR_CHECKLIST_ITEMS,
  OVERHEAD_SUPPLY_CHECKLIST_ITEMS,
  ratingVerdict,
  STAGE_OPTIONS,
} from '../place-trade'
import { useTrades, type TradeVcpContraction } from '../trades'
import './TradeDetailPage.css'

const RATING_STAR_COUNT = 7

/** % pullback for one stored contraction — null only if `high` is 0 (shouldn't happen, but avoids a div/0). */
function contractionPercent(c: TradeVcpContraction): number | null {
  return c.high === 0 ? null : ((c.high - c.low) / c.high) * 100
}

function checklistCount(items: { id: string }[], checked: Record<string, boolean>): number {
  return items.filter((item) => checked[item.id]).length
}

/** `computeTradeRating` was built for the live, string-typed stepper form — this
 * feeds it the same shape from the persisted, numeric `TradeSetup` so the Review
 * step's "why this score" breakdown can be reconstructed after the fact too. */
function numberToInputString(value: number | null): string {
  return value === null ? '' : String(value)
}

/** Read-only record of a past trade: the core fill data plus, when present, the full
 * setup captured by the place-trade stepper at the moment it was placed. Reached by
 * opening a trade's link from the Dashboard's trades table (in a new tab). */
export function TradeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { trades, loading, error } = useTrades()
  const trade = trades.find((t) => t.id === id) ?? null

  const setup = trade?.setup
  const stage = setup?.stage ? STAGE_OPTIONS.find((s) => s.id === setup.stage) : undefined
  const base = setup?.base ? BASE_OPTIONS.find((b) => b.id === setup.base) : undefined
  const rating =
    trade && setup
      ? computeTradeRating({
          side: trade.side,
          tradeParams: {
            entryPrice: String(trade.entryPrice),
            stopLoss: numberToInputString(setup.stopLoss),
            target: numberToInputString(setup.target),
            quantity: String(trade.quantity),
            entryDate: '',
          },
          stageBaseAnswers: { stage: setup.stage, base: setup.base },
          indicatorData: {
            rsi: numberToInputString(setup.rsi),
            fiftyDayMa: numberToInputString(setup.fiftyDayMa),
            week52Low: numberToInputString(setup.week52Low),
            week52High: numberToInputString(setup.week52High),
          },
          indicatorChecklistChecked: setup.technicalChecklist,
          vcpStructureData: {
            weeksInBase: numberToInputString(setup.weeksInBase),
            contractions: setup.vcpContractions.map((c) => ({
              high: String(c.high),
              low: String(c.low),
            })),
          },
          finalChecksChecked: setup.finalChecks,
        })
      : null
  const verdict = rating ? ratingVerdict(rating.ratio) : null
  const contractions = setup?.vcpContractions ?? []
  const percents = contractions.map(contractionPercent).filter((p): p is number => p !== null)
  const largest = percents.length ? Math.max(...percents) : null
  const narrowest = percents.length ? Math.min(...percents) : null

  return (
    <section className="trade-detail-page">
      <PageHeader
        icon="info"
        title="Trade Detail"
        subtitle="A read-only record of the trade and the setup that justified it."
        actions={
          <Link to="/" className="trade-detail-page__back-link">
            ← Back to Dashboard
          </Link>
        }
      />

      {loading && <p className="trade-detail-page__state">Loading…</p>}

      {error && (
        <p className="trade-detail-page__state trade-detail-page__state--error">
          Couldn’t load trades: {error}.
        </p>
      )}

      {!loading && !error && !trade && (
        <p className="trade-detail-page__state">That trade doesn't exist (maybe it was removed).</p>
      )}

      {trade && (
        <Card className="trade-detail-page__card">
          <div className="trade-detail__header">
            <span
              className="trade-detail__avatar"
              style={{ background: avatarColor(trade.symbol) }}
              aria-hidden="true"
            >
              {trade.symbol.slice(0, 2)}
            </span>
            <div className="trade-detail__heading">
              <span className="trade-detail__symbol">{trade.symbol}</span>
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
                  trade.metrics.pnl === null
                    ? ''
                    : trade.metrics.pnl > 0
                      ? 'is-good'
                      : trade.metrics.pnl < 0
                        ? 'is-critical'
                        : ''
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

          {setup && rating && verdict && (
            <>
              <div className={`trade-detail__rating trade-detail__rating--${verdict.tone}`}>
                <span
                  className="trade-detail__rating-stars"
                  style={{ '--fill': `${rating.ratio * 100}%` } as CSSProperties}
                >
                  <span className="trade-detail__rating-stars-track">
                    {Array.from({ length: RATING_STAR_COUNT }, (_, i) => (
                      <Icon key={i} name="star" size={20} />
                    ))}
                  </span>
                  <span className="trade-detail__rating-stars-fill" aria-hidden="true">
                    {Array.from({ length: RATING_STAR_COUNT }, (_, i) => (
                      <Icon key={i} name="star" size={20} />
                    ))}
                  </span>
                </span>
                <span className="trade-detail__rating-score">
                  {Math.round(rating.ratio * 100)}%
                </span>
                <span className="trade-detail__rating-verdict">{verdict.label}</span>
              </div>

              <div className="trade-detail__section">
                <span className="trade-detail__section-title">
                  Why {Math.round(rating.ratio * 100)}%? — {formatPoints(rating.earnedWeight)} of{' '}
                  {formatPoints(rating.totalWeight)} points
                </span>
                <ul className="trade-detail__breakdown">
                  {rating.criteria.map((c) => {
                    const state = criterionState(c)
                    return (
                      <li key={c.id} className={`trade-detail__breakdown-row is-${state}`}>
                        <Icon name={CRITERION_STATE_ICON[state]} size={14} />
                        <span className="trade-detail__breakdown-label">{c.label}</span>
                        <span className="trade-detail__breakdown-points">
                          {formatPoints(criterionPoints(c))}/{formatPoints(c.weight)}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </div>

              <div className="trade-detail__section">
                <span className="trade-detail__section-title">Setup</span>
                <div className="trade-detail__grid">
                  <div className="trade-detail__stat">
                    <span className="trade-detail__stat-label">Watched for</span>
                    <span className="trade-detail__stat-value">
                      {setup.watchedSince
                        ? formatDuration(
                            new Date(trade.entryTime).getTime() -
                              new Date(setup.watchedSince).getTime(),
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
                  VCP Structure — {contractions.length} contraction
                  {contractions.length === 1 ? '' : 's'}
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
                  Overhead Supply —{' '}
                  {checklistCount(OVERHEAD_SUPPLY_CHECKLIST_ITEMS, setup.finalChecks)}/
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
        </Card>
      )}
    </section>
  )
}
