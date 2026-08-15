import './MetricExplainer.css'

export type MetricExplainerTone = 'good' | 'caution' | 'bad'

export interface MetricExplainerBand {
  tone: MetricExplainerTone
  /** The threshold, e.g. "Under 0.5" or "Above 5x". */
  value: string
  /** The read, e.g. "Safe" or "Comfortable". */
  label: string
}

interface MetricExplainerProps {
  /** The sentence answering "why does this metric exist" — no leading "Question it answers:", the
   * component supplies that lead-in itself so every explainer phrases it identically. */
  question: string
  /** Where the raw figures come from, e.g. "Balance Sheet, annual figures." */
  where: string
  formula: string
  /** 2–3 fixed-threshold colour bands, ordered however reads best (loosest/best first is typical). */
  bands: MetricExplainerBand[]
  /** A short plain-language worked example. */
  example: string
  /** Why the metric matters — one or two sentences. */
  body: string
}

/** The shared shell every metric's explainer panel renders through — always-expanded and static,
 * deliberately not a `HoverCard` like `Code33Explainer`: the trader is learning these ratios while
 * typing figures in, so the question, formula, colour bands, and worked example need to stay on
 * screen, not sit behind a trigger. Laid out as a compact two-column reference (formula/bands |
 * example/why) rather than one long stacked column, so it reads in full without pushing the grid
 * below the fold. Content-only props — each metric's own explainer component (e.g.
 * `DebtEquityExplainer`, `InterestCoverageExplainer`) supplies its fixed text and owns nothing
 * about layout, so every metric's panel reads and behaves identically. */
export function MetricExplainer({ question, where, formula, bands, example, body }: MetricExplainerProps) {
  return (
    <div className="metric-explainer">
      <p className="metric-explainer__question">
        <strong>Question it answers:</strong> {question}{' '}
        <span className="metric-explainer__where">{where}</span>
      </p>

      <div className="metric-explainer__grid">
        <div className="metric-explainer__ref">
          <div className="metric-explainer__formula">{formula}</div>
          <div className="metric-explainer__bands">
            {bands.map((band) => (
              <span key={band.value} className={`metric-explainer__band is-${band.tone}`}>
                {band.value} <b>{band.label}</b>
              </span>
            ))}
          </div>
        </div>

        <div className="metric-explainer__narrative">
          <p className="metric-explainer__example">{example}</p>
          <p className="metric-explainer__body">{body}</p>
        </div>
      </div>
    </div>
  )
}
