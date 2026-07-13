import { useMemo, useState } from 'react'
import { Card } from '../../../shared/components/Card'
import { formatSignedCurrency } from '../../../shared/utils/format'
import { STOP_LEAK_R } from '../utils/performanceStats'
import type { ReportTrade } from '../types/report'
import './RatingVsOutcomeChart.css'

interface RatingVsOutcomeChartProps {
  trades: ReportTrade[]
}

const W = 820
const H = 300
const PAD = { top: 24, right: 24, bottom: 46, left: 52 }

/** `ratingVerdict`'s "Good setup" floor — left of this line the rating was telling you not
 * to take the trade. Kept in sync with `ratingVerdict` in modules/place-trade. */
const GOOD_SETUP_RATIO = 0.7

/**
 * Setup score at entry versus what the trade actually returned.
 *
 * This is the chart that earns its keep over time: if the rating is worth anything, points
 * should drift up and to the right. At a handful of trades it can't show a relationship yet
 * — what it *can* show immediately is how much of your activity sits in the bottom-left
 * quadrant: weak setups, taken anyway, that lost.
 */
export function RatingVsOutcomeChart({ trades }: RatingVsOutcomeChartProps) {
  const [hover, setHover] = useState<string | null>(null)

  const plotted = useMemo(
    () => trades.filter((t) => t.rMultiple !== null && t.ratingRatio !== null),
    [trades],
  )

  const geom = useMemo(() => {
    const rs = plotted.map((t) => t.rMultiple as number)
    const rawMax = Math.max(1, ...rs)
    const rawMin = Math.min(STOP_LEAK_R - 0.4, ...rs)
    const span = rawMax - rawMin || 1
    const yMax = rawMax + span * 0.14
    const yMin = rawMin - span * 0.14

    const plotW = W - PAD.left - PAD.right
    const plotH = H - PAD.top - PAD.bottom

    const sx = (ratio: number) => PAD.left + ratio * plotW
    const sy = (r: number) => PAD.top + (1 - (r - yMin) / (yMax - yMin)) * plotH

    const yTicks = [1, 0, STOP_LEAK_R, -2].filter((v) => v >= yMin && v <= yMax)
    const xTicks = [0, 0.25, 0.5, 0.75, 1]

    return { sx, sy, yTicks, xTicks }
  }, [plotted])

  if (plotted.length === 0) {
    return (
      <Card className="scatter">
        <h3 className="scatter__title">Setup quality vs. outcome</h3>
        <p className="scatter__empty">
          Needs closed trades that carry both a setup rating and a stop loss.
        </p>
      </Card>
    )
  }

  const active = plotted.find((t) => t.trade.id === hover) ?? null

  return (
    <Card className="scatter">
      <div className="scatter__head">
        <div>
          <h3 className="scatter__title">Setup quality vs. outcome</h3>
          <p className="scatter__sub">
            The setup score at entry against what the trade returned. If the rating is worth
            anything, points drift up and to the right as they accumulate.
          </p>
        </div>
        <ul className="scatter__legend">
          <li className="scatter__legend-item">
            <span className="scatter__swatch scatter__swatch--win" aria-hidden="true" />
            Win
          </li>
          <li className="scatter__legend-item">
            <span className="scatter__swatch scatter__swatch--loss" aria-hidden="true" />
            Loss
          </li>
        </ul>
      </div>

      <div className="scatter__plot">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="scatter__svg"
          role="img"
          aria-label="Scatter of setup rating at entry against realized R-multiple for each closed trade"
        >
          {/* Everything left of the "Good setup" line is a trade the rating advised against. */}
          <rect
            x={PAD.left}
            y={PAD.top}
            width={geom.sx(GOOD_SETUP_RATIO) - PAD.left}
            height={H - PAD.top - PAD.bottom}
            className="scatter__weak-zone"
          />
          <text
            x={geom.sx(GOOD_SETUP_RATIO) - 8}
            y={PAD.top + 14}
            className="scatter__zone-label"
            textAnchor="end"
          >
            Rating said don’t trade
          </text>

          {geom.yTicks.map((v) => (
            <g key={`y${v}`}>
              <line
                x1={PAD.left}
                x2={W - PAD.right}
                y1={geom.sy(v)}
                y2={geom.sy(v)}
                className={v === STOP_LEAK_R ? 'scatter__leak-line' : 'scatter__grid'}
              />
              <text x={PAD.left - 10} y={geom.sy(v) + 4} className="scatter__tick" textAnchor="end">
                {v.toFixed(0)}R
              </text>
            </g>
          ))}

          {geom.xTicks.map((v) => (
            <text
              key={`x${v}`}
              x={geom.sx(v)}
              y={H - PAD.bottom + 20}
              className="scatter__tick"
              textAnchor="middle"
            >
              {Math.round(v * 100)}%
            </text>
          ))}

          <line
            x1={PAD.left}
            x2={W - PAD.right}
            y1={geom.sy(0)}
            y2={geom.sy(0)}
            className="scatter__baseline"
          />

          <text
            x={PAD.left + (W - PAD.left - PAD.right) / 2}
            y={H - 8}
            className="scatter__axis-label"
            textAnchor="middle"
          >
            Setup rating at entry
          </text>

          {plotted.map((t) => {
            const cx = geom.sx(t.ratingRatio as number)
            const cy = geom.sy(t.rMultiple as number)
            const isWin = (t.trade.metrics.outcome ?? 'loss') === 'win'
            return (
              <g
                key={t.trade.id}
                onMouseEnter={() => setHover(t.trade.id)}
                onMouseLeave={() => setHover(null)}
              >
                <circle cx={cx} cy={cy} r="14" className="scatter__hit" />
                {/* 2px surface ring keeps overlapping points readable. */}
                <circle
                  cx={cx}
                  cy={cy}
                  r="6"
                  className={`scatter__dot ${isWin ? 'is-win' : 'is-loss'}${hover === t.trade.id ? ' is-active' : ''}`}
                />
                <text x={cx + 11} y={cy + 4} className="scatter__point-label">
                  {t.trade.symbol}
                </text>
              </g>
            )
          })}
        </svg>

        {active && (
          <div
            className="scatter__tooltip"
            style={{
              left: `${(geom.sx(active.ratingRatio as number) / W) * 100}%`,
              top: `${(geom.sy(active.rMultiple as number) / H) * 100}%`,
            }}
          >
            <div className="scatter__tt-value">{active.trade.symbol}</div>
            <div className="scatter__tt-meta">
              Rated {Math.round((active.ratingRatio as number) * 100)}% ·{' '}
              {(active.rMultiple as number).toFixed(2)}R ·{' '}
              {formatSignedCurrency(active.trade.metrics.pnl ?? 0)}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
