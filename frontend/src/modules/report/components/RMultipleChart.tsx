import { useMemo, useState } from 'react'
import { Card } from '../../../shared/components/Card'
import { formatDateTime, formatSignedCurrency } from '../../../shared/utils/format'
import { STOP_LEAK_R } from '../utils/performanceStats'
import { sortByExitAsc } from '../utils/reportTrades'
import type { ReportTrade } from '../types/report'
import './RMultipleChart.css'

interface RMultipleChartProps {
  trades: ReportTrade[]
}

const W = 820
const H = 300
const PAD = { top: 24, right: 20, bottom: 46, left: 52 }
const MAX_BAR_W = 56
const CORNER = 4

function formatR(value: number): string {
  const sign = value > 0 ? '+' : value < 0 ? '−' : ''
  return `${sign}${Math.abs(value).toFixed(2)}R`
}

/** A bar anchored to the baseline with only its data end rounded — the end that carries the
 * value gets the 4px corner, the baseline end stays square against the axis. */
function barPath(x: number, w: number, baselineY: number, valueY: number): string {
  const up = valueY < baselineY
  const dir = up ? 1 : -1
  const r = Math.min(CORNER, w / 2, Math.abs(baselineY - valueY))
  const approach = valueY + dir * r
  return [
    `M${x},${baselineY}`,
    `L${x},${approach}`,
    `Q${x},${valueY} ${x + r},${valueY}`,
    `L${x + w - r},${valueY}`,
    `Q${x + w},${valueY} ${x + w},${approach}`,
    `L${x + w},${baselineY}`,
    'Z',
  ].join(' ')
}

/**
 * Realized R per trade — what each trade returned in units of the risk it planned.
 *
 * The whole point of the chart is the −1R line: a trade that honours its stop cannot fall
 * below it, so any bar that punches through is a stop that leaked. Every bar is
 * direct-labelled with its value, so the red/green fill is reinforcement, never the only
 * thing carrying the meaning.
 */
export function RMultipleChart({ trades }: RMultipleChartProps) {
  const [hover, setHover] = useState<number | null>(null)

  const plotted = useMemo(
    () => sortByExitAsc(trades).filter((t) => t.rMultiple !== null),
    [trades],
  )

  const geom = useMemo(() => {
    const values = plotted.map((t) => t.rMultiple as number)
    const rawMax = Math.max(0.5, ...values)
    const rawMin = Math.min(STOP_LEAK_R - 0.4, ...values)
    const span = rawMax - rawMin || 1
    const yMax = rawMax + span * 0.12
    const yMin = rawMin - span * 0.12

    const plotW = W - PAD.left - PAD.right
    const plotH = H - PAD.top - PAD.bottom
    const step = plotW / Math.max(plotted.length, 1)
    const barW = Math.min(MAX_BAR_W, step * 0.55)

    const sy = (v: number) => PAD.top + (1 - (v - yMin) / (yMax - yMin)) * plotH
    const sx = (i: number) => PAD.left + step * i + step / 2

    const ticks = [1, 0, STOP_LEAK_R, -2].filter((v) => v >= yMin && v <= yMax)

    return { sx, sy, barW, ticks, zeroY: sy(0), leakY: sy(STOP_LEAK_R) }
  }, [plotted])

  if (plotted.length === 0) {
    return (
      <Card className="rchart">
        <h3 className="rchart__title">Realized R per trade</h3>
        <p className="rchart__empty">
          No closed trade has a stop loss recorded, so there’s no planned risk to measure
          the result against.
        </p>
      </Card>
    )
  }

  const active = hover !== null ? plotted[hover] : null

  return (
    <Card className="rchart">
      <div className="rchart__head">
        <div>
          <h3 className="rchart__title">Realized R per trade</h3>
          <p className="rchart__sub">
            What each trade returned per unit of risk it planned. Honouring the stop puts the
            floor at −1.00R — a bar below that line is a stop that leaked.
          </p>
        </div>
      </div>

      <div className="rchart__plot">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="rchart__svg"
          role="img"
          aria-label="Realized R-multiple for each closed trade, against the minus one R planned-risk line"
        >
          {geom.ticks.map((v) => (
            <g key={v}>
              <line
                x1={PAD.left}
                x2={W - PAD.right}
                y1={geom.sy(v)}
                y2={geom.sy(v)}
                className="rchart__grid"
              />
              <text
                x={PAD.left - 10}
                y={geom.sy(v) + 4}
                className="rchart__ytick"
                textAnchor="end"
              >
                {v.toFixed(0)}R
              </text>
            </g>
          ))}

          {/* The planned-risk floor — the line the whole chart exists to compare against. */}
          <line
            x1={PAD.left}
            x2={W - PAD.right}
            y1={geom.leakY}
            y2={geom.leakY}
            className="rchart__leak-line"
          />
          {/* Sits *below* the line: above it is where the bars' value labels land. */}
          <text x={W - PAD.right} y={geom.leakY + 15} className="rchart__leak-label" textAnchor="end">
            Planned risk — stop honoured
          </text>

          <line
            x1={PAD.left}
            x2={W - PAD.right}
            y1={geom.zeroY}
            y2={geom.zeroY}
            className="rchart__baseline"
          />

          {plotted.map((t, i) => {
            const r = t.rMultiple as number
            const x = geom.sx(i) - geom.barW / 2
            const valueY = geom.sy(r)
            const isWin = r > 0
            const leaked = r < STOP_LEAK_R
            return (
              <g
                key={t.trade.id}
                className="rchart__bar-group"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              >
                {/* Hit target wider than the bar itself. */}
                <rect
                  x={geom.sx(i) - (W - PAD.left - PAD.right) / plotted.length / 2}
                  y={PAD.top}
                  width={(W - PAD.left - PAD.right) / plotted.length}
                  height={H - PAD.top - PAD.bottom}
                  className="rchart__hit"
                />
                <path
                  d={barPath(x, geom.barW, geom.zeroY, valueY)}
                  className={`rchart__bar ${isWin ? 'is-win' : 'is-loss'}${leaked ? ' is-leaked' : ''}${hover === i ? ' is-active' : ''}`}
                />
                <text
                  x={geom.sx(i)}
                  y={valueY + (isWin ? -8 : 15)}
                  className="rchart__value"
                  textAnchor="middle"
                >
                  {formatR(r)}
                </text>
                <text
                  x={geom.sx(i)}
                  y={H - PAD.bottom + 18}
                  className="rchart__xtick"
                  textAnchor="middle"
                >
                  {t.trade.symbol}
                </text>
              </g>
            )
          })}
        </svg>

        {active && (
          <div
            className="rchart__tooltip"
            style={{
              left: `${(geom.sx(hover as number) / W) * 100}%`,
              top: `${(geom.sy(active.rMultiple as number) / H) * 100}%`,
            }}
          >
            <div className="rchart__tt-value">
              {active.trade.symbol} · {formatR(active.rMultiple as number)}
            </div>
            <div className="rchart__tt-meta">
              {formatSignedCurrency(active.trade.metrics.pnl ?? 0)} ·{' '}
              {formatDateTime(active.trade.exitTime as string)}
            </div>
            {(active.rMultiple as number) < STOP_LEAK_R && (
              <div className="rchart__tt-flag">Lost more than the risk it planned</div>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}
