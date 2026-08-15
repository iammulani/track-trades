import { Modal } from '../../../shared/components/Modal'
import { RatingStars } from '../../../shared/components/RatingStars'
import { avatarColor } from '../../../shared/utils/avatarColor'
import {
  formatPercent,
  formatSignedPercent,
  formatSignedPoints,
} from '../../../shared/utils/format'
import {
  buildQuarterTones,
  CODE33_STARS,
  code33Verdict,
  computeCode33,
  deriveQuarters,
  formatPeriodLabel,
  metricTone,
} from '../../fundamentals'
import type { ExitedWatchlistItem } from '../types/exitedWatchlistItem'
import './ExitedFundamentalsModal.css'

interface ExitedFundamentalsModalProps {
  /** The item whose captured fundamentals are open — `null` keeps the popup closed. */
  item: ExitedWatchlistItem | null
  onClose: () => void
}

function toneClass(accelerated: boolean | undefined): string {
  return accelerated === undefined ? '' : accelerated ? ' is-good' : ' is-bad'
}

/** Read-only view of the fundamentals captured for the item before it was exited — the same
 * Code 33 read `Code33Summary`/`QuarterlyGrid` show live, but frozen: no editing, no "as of"
 * picker, since the record behind it no longer exists to edit. */
export function ExitedFundamentalsModal({ item, onClose }: ExitedFundamentalsModalProps) {
  const quarters = item?.fundamentals?.quarters ?? []
  const rating = quarters.length > 0 ? computeCode33(quarters) : null
  const verdict = rating ? code33Verdict(rating) : null
  const derived = quarters.length > 0 ? deriveQuarters(quarters) : []
  const tones = rating ? buildQuarterTones(rating.steps) : {}
  const stepCount = rating ? rating.totalChecks / 3 : 0

  return (
    <Modal open={item !== null} onClose={onClose} width={620} labelledBy="exited-fundamentals-title">
      {item && rating && verdict && (
        <>
          <div className="exited-fund-modal__head">
            <span
              className="exited-fund-modal__avatar"
              style={{ background: avatarColor(item.symbol) }}
              aria-hidden="true"
            >
              {item.symbol.slice(0, 2)}
            </span>
            <div>
              <h3 id="exited-fundamentals-title" className="exited-fund-modal__symbol">
                {item.symbol}
              </h3>
              <p className="exited-fund-modal__sub">
                Fundamentals as captured on your watchlist, as of{' '}
                {item.fundamentals && formatPeriodLabel(item.fundamentals.asOfPeriod)}
              </p>
            </div>
          </div>

          <div className="exited-fund-modal__score">
            <RatingStars ratio={rating.ratio} count={CODE33_STARS} size={18} />
            <span className="exited-fund-modal__score-num">
              {rating.stars.toFixed(1)} / {CODE33_STARS}
            </span>
            <span className={`exited-fund-modal__verdict is-${verdict.tone}`}>{verdict.label}</span>
          </div>

          {rating.status !== 'pending' && (
            <div className="exited-fund-modal__breakdown">
              {(
                [
                  ['EPS', rating.epsHits],
                  ['Sales', rating.salesHits],
                  ['Margin', rating.marginHits],
                ] as const
              ).map(([label, hits]) => (
                <div key={label} className="exited-fund-modal__breakdown-row">
                  <span>{label}</span>
                  <span className={`is-${metricTone(hits, stepCount)}`}>
                    {hits}/{stepCount}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="exited-fund-modal__grid-scroll">
            <table className="exited-fund-modal__grid">
              <thead>
                <tr>
                  <th className="ta-left">Quarter</th>
                  <th className="ta-right">Sales</th>
                  <th className="ta-right">Net Profit</th>
                  <th className="ta-right">EPS</th>
                  <th className="ta-right">Margin</th>
                  <th className="ta-right">Margin YoY</th>
                  <th className="ta-right">Sales YoY</th>
                  <th className="ta-right">EPS YoY</th>
                </tr>
              </thead>
              <tbody>
                {derived.map((d) => {
                  const tone = tones[d.period]
                  return (
                    <tr key={d.period}>
                      <td className="ta-left">{formatPeriodLabel(d.period)}</td>
                      <td className="ta-right">{d.sales ?? '—'}</td>
                      <td className="ta-right">{d.netProfit ?? '—'}</td>
                      <td className="ta-right">{d.eps ?? '—'}</td>
                      <td className={`ta-right${toneClass(tone?.margin)}`}>
                        {d.netMargin !== null ? formatPercent(d.netMargin) : '—'}
                      </td>
                      <td className="ta-right">
                        {d.netMarginChangeYoY !== null ? formatSignedPoints(d.netMarginChangeYoY) : '—'}
                      </td>
                      <td className={`ta-right${toneClass(tone?.sales)}`}>
                        {d.salesGrowthYoY !== null ? formatSignedPercent(d.salesGrowthYoY) : '—'}
                      </td>
                      <td className={`ta-right${toneClass(tone?.eps)}`}>
                        {d.epsGrowthYoY !== null ? formatSignedPercent(d.epsGrowthYoY) : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Modal>
  )
}
