import { MetricExplainer } from './MetricExplainer'

/** Interest Coverage's fixed reference content, rendered through the shared `MetricExplainer`
 * shell — see that component for why this is always-expanded rather than a `HoverCard`. The body
 * text ties it back to Debt to Equity deliberately: D/E says how much debt there is, this says
 * whether it can actually be afforded — a company can carry modest debt on weak profits, or heavy
 * debt it services easily, so neither ratio alone is the full picture. */
export function InterestCoverageExplainer() {
  return (
    <MetricExplainer
      question="can they comfortably afford the interest they owe?"
      where="Quarterly Results, every quarter."
      formula="Interest Coverage = Operating Profit ÷ Interest"
      bands={[
        { tone: 'bad', value: 'Below 3x', label: 'Fragile' },
        { tone: 'caution', value: '3x – 5x', label: 'Tight' },
        { tone: 'good', value: 'Above 5x', label: 'Comfortable' },
      ]}
      example="You earn ₹90,000 a month and your EMI is ₹10,000 — that's 9x coverage, easy. If the EMI were ₹45,000, that's 2x — one bad month and you're in trouble."
      body="Debt to Equity tells you how much debt there is; this tells you whether they can afford it. A company can have modest debt but weak profits — or heavy debt it services easily."
    />
  )
}
