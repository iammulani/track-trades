import './DebtEquityExplainer.css'

/** Always-expanded, deliberately not a `HoverCard` like `Code33Explainer` — the trader is
 * learning this ratio while typing figures in, so the question it answers and the worked example
 * need to stay on screen, not sit behind a trigger they have to remember to open. Laid out as a
 * compact two-column reference (formula/bands | example/why) rather than one long stacked column,
 * so the same content reads without eating the page's vertical space above the grid.
 * No "trap" caveat here — deliberately kept to just the question, formula, colour bands, and the
 * worked example, so it stays a quick reference rather than growing into a longer explainer. */
export function DebtEquityExplainer() {
  return (
    <div className="debt-equity-explainer">
      <p className="debt-equity-explainer__question">
        <strong>Question it answers:</strong> how much of this business was built with borrowed
        money? <span className="debt-equity-explainer__where">Balance Sheet, annual figures.</span>
      </p>

      <div className="debt-equity-explainer__grid">
        <div className="debt-equity-explainer__ref">
          <div className="debt-equity-explainer__formula">
            Debt/Equity = Borrowings ÷ (Equity Capital + Reserves)
          </div>
          <div className="debt-equity-explainer__bands">
            <span className="debt-equity-explainer__band is-good">
              Under 0.5 <b>Safe</b>
            </span>
            <span className="debt-equity-explainer__band is-caution">
              0.5 – 1.0 <b>Watch</b>
            </span>
            <span className="debt-equity-explainer__band is-bad">
              Over 1.0 <b>Fragile</b>
            </span>
          </div>
        </div>

        <div className="debt-equity-explainer__narrative">
          <p className="debt-equity-explainer__example">
            You buy a ₹1 crore flat with ₹70 lakh of savings and a ₹30 lakh loan. Your D/E is
            0.43. Most of it is yours.
          </p>
          <p className="debt-equity-explainer__body">
            Debt gets repaid whether the business's year is good or bad. Low debt means it
            survives a bad year; high debt means one bad year can end it.
          </p>
        </div>
      </div>
    </div>
  )
}
