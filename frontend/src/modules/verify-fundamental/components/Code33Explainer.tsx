import { HoverCard } from '../../../shared/components/HoverCard'
import { Icon } from '../../../shared/components/Icon'
import './Code33Explainer.css'

/** A reminder of what Code 33 actually checks — and what it doesn't — shown behind an info
 * trigger next to the page header. Deliberately a generic, made-up example rather than the
 * watchlist item currently being verified, so the explanation stays the same reminder every
 * time this page is opened, for any stock. */
export function Code33Explainer() {
  return (
    <HoverCard
      label="What Code 33 actually checks"
      triggerClassName="hover-card__trigger--plain code33-explainer-trigger"
      trigger={
        <>
          <Icon name="info" size={13} />
          What is Code 33?
        </>
      }
    >
      <div className="code33-explainer">
        <div className="code33-explainer__heading">What Code 33 actually checks</div>
        <p className="code33-explainer__intro">Each metric is one link in the chain:</p>

        <div className="code33-explainer__section">
          <span className="code33-explainer__section-title">
            <Icon name="dollar" size={12} /> Sales — do customers want it?
          </span>
          <p>Money coming in the door. Pure demand. Can't be faked by accounting.</p>
        </div>

        <div className="code33-explainer__section">
          <span className="code33-explainer__section-title">
            <Icon name="target" size={12} /> Net margin — how much do they keep?
          </span>
          <p>
            Of every ₹100 a company bills, some slice becomes profit — say ₹9. This tests
            efficiency and pricing power. If a company grows sales by discounting, this falls.
          </p>
        </div>

        <div className="code33-explainer__section">
          <span className="code33-explainer__section-title">
            <Icon name="trending" size={12} /> EPS — how much reaches you?
          </span>
          <p>
            Profit divided by shares outstanding. It's your slice as an owner. If the company
            issues more shares, your slice shrinks even when profit grows.
          </p>
        </div>

        <div className="code33-explainer__section">
          <span className="code33-explainer__section-title">
            <Icon name="layers" size={12} /> Why all three
          </span>
          <p>
            You can't fake the set. Rising EPS alone might be buybacks. Rising sales alone might
            be discounting. All three rising together means a business genuinely selling more, at
            better economics, without diluting owners.
          </p>
        </div>

        <div className="code33-explainer__section code33-explainer__section--warning">
          <span className="code33-explainer__section-title">
            <Icon name="alert" size={12} /> What Code 33 does NOT tell you
          </span>
          <ul>
            <li>
              <strong>Debt</strong> — interest payments aren't in Code 33.
            </li>
            <li>
              <strong>Cash flow</strong> — profit is an accounting number; cash is real. A company
              can show profit and bleed cash.
            </li>
            <li>
              <strong>Valuation</strong> — a great business at a stupid price is a bad investment.
              Code 33 says nothing about the P/E you're paying.
            </li>
            <li>
              <strong>Durability</strong> — Crocs passed every test right before it collapsed 98%.
            </li>
          </ul>
        </div>

        <p className="code33-explainer__closing">
          Code 33 tells you the engine is running hot right now. It doesn't tell you the car is
          well-built or fairly priced.
        </p>
      </div>
    </HoverCard>
  )
}
