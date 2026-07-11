import { useId, useMemo, useState } from 'react'
import { Card } from '../../../shared/components/Card'
import { formatDateTime, formatSignedCurrency } from '../../../shared/utils/format'
import type { EquityPoint } from '../utils/equitySeries'
import './EquityCurve.css'

interface EquityCurveProps {
  points: EquityPoint[]
}

const W = 820
const H = 280
const PAD = { top: 20, right: 20, bottom: 28, left: 60 }

/** Round "nice" tick values (…, 500, 1000, 1500, …) spanning [min, max]. */
function niceTicks(min: number, max: number, count = 3): number[] {
  const range = max - min || 1
  const rawStep = range / count
  const mag = 10 ** Math.floor(Math.log10(rawStep))
  const norm = rawStep / mag
  const niceStep = (norm >= 5 ? 10 : norm >= 2.5 ? 5 : norm >= 2 ? 2.5 : norm >= 1 ? 2 : 1) * mag
  const ticks: number[] = []
  for (let v = Math.ceil(min / niceStep) * niceStep; v <= max; v += niceStep) ticks.push(v)
  return ticks
}

/** Cumulative P&L over time — one series, area + line, with a hover tooltip. */
export function EquityCurve({ points }: EquityCurveProps) {
  const gradientId = useId()
  const [hover, setHover] = useState<number | null>(null)

  const geom = useMemo(() => {
    const times = points.map((p) => p.time)
    const values = points.map((p) => p.cumulative)
    const xMin = Math.min(...times)
    const xMax = Math.max(...times)
    const rawMax = Math.max(0, ...values)
    const rawMin = Math.min(0, ...values)
    const span = rawMax - rawMin || 1
    const yMax = rawMax + span * 0.12
    const yMin = rawMin - span * 0.12

    const plotW = W - PAD.left - PAD.right
    const plotH = H - PAD.top - PAD.bottom
    const sx = (t: number) =>
      PAD.left + (xMax === xMin ? plotW / 2 : ((t - xMin) / (xMax - xMin)) * plotW)
    const sy = (v: number) => PAD.top + (1 - (v - yMin) / (yMax - yMin)) * plotH

    const coords = points.map((p) => ({ x: sx(p.time), y: sy(p.cumulative) }))
    const line = coords
      .map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x.toFixed(1)},${c.y.toFixed(1)}`)
      .join(' ')
    const zeroY = sy(0)
    const area = `${line} L${coords[coords.length - 1].x.toFixed(1)},${zeroY.toFixed(1)} L${coords[0].x.toFixed(1)},${zeroY.toFixed(1)} Z`

    // Clean, round y gridlines
    const ticks = niceTicks(yMin, yMax).map((v) => ({ v, y: sy(v) }))

    return { coords, line, area, zeroY, ticks, sx, sy }
  }, [points])

  const last = points[points.length - 1]
  const active = hover !== null ? points[hover] : null
  const activeCoord = hover !== null ? geom.coords[hover] : null

  function onMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const xViewBox = ((e.clientX - rect.left) / rect.width) * W
    let nearest = 0
    let best = Infinity
    geom.coords.forEach((c, i) => {
      const d = Math.abs(c.x - xViewBox)
      if (d < best) {
        best = d
        nearest = i
      }
    })
    setHover(nearest)
  }

  return (
    <Card className="equity">
      <div className="equity__head">
        <div>
          <h3 className="equity__title">Equity curve</h3>
          <p className="equity__sub">Cumulative P&amp;L across closed trades</p>
        </div>
        <span className={`equity__total ${last.cumulative >= 0 ? 'is-good' : 'is-bad'}`}>
          {formatSignedCurrency(last.cumulative)}
        </span>
      </div>

      <div className="equity__plot">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="equity__svg"
          onMouseMove={onMove}
          onMouseLeave={() => setHover(null)}
          role="img"
          aria-label="Cumulative profit and loss over time"
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.22" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {geom.ticks.map((t, i) => (
            <g key={i}>
              <line x1={PAD.left} x2={W - PAD.right} y1={t.y} y2={t.y} className="equity__grid" />
              <text x={PAD.left - 10} y={t.y + 4} className="equity__ytick" textAnchor="end">
                {formatSignedCurrency(t.v).replace('.00', '')}
              </text>
            </g>
          ))}

          <line
            x1={PAD.left}
            x2={W - PAD.right}
            y1={geom.zeroY}
            y2={geom.zeroY}
            className="equity__baseline"
          />

          <path d={geom.area} fill={`url(#${gradientId})`} />
          <path d={geom.line} className="equity__line" fill="none" />

          {activeCoord && (
            <>
              <line
                x1={activeCoord.x}
                x2={activeCoord.x}
                y1={PAD.top}
                y2={H - PAD.bottom}
                className="equity__crosshair"
              />
              <circle cx={activeCoord.x} cy={activeCoord.y} r="5" className="equity__dot" />
            </>
          )}

          {/* End marker */}
          <circle
            cx={geom.coords[geom.coords.length - 1].x}
            cy={geom.coords[geom.coords.length - 1].y}
            r="4.5"
            className="equity__end"
          />
        </svg>

        {active && activeCoord && (
          <div
            className="equity__tooltip"
            style={{
              left: `${(activeCoord.x / W) * 100}%`,
              top: `${(activeCoord.y / H) * 100}%`,
            }}
          >
            <div className="equity__tt-value">{formatSignedCurrency(active.cumulative)}</div>
            <div className="equity__tt-meta">
              {active.symbol ? `${active.symbol} · ` : 'Start · '}
              {formatDateTime(new Date(active.time).toISOString())}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
