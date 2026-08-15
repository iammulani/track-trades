import { MetricExplainer } from './MetricExplainer'

/** Cash Conversion's fixed reference content, rendered through the shared `MetricExplainer` shell
 * — see that component for why this is always-expanded rather than a `HoverCard`. The body text
 * calls out that "Investigate" is really about a ratio that stays low across *several* years, not
 * a single year (one late invoice can dent a single year without meaning much), and points at the
 * Self-Funded column as the sharper, related read built from the same figures — see
 * `CashConversionGrid`'s own column-header note for that formula. */
export function CashConversionExplainer() {
  return (
    <MetricExplainer
      question="is the reported profit turning into real money?"
      where="Cash Flow section, annual figures."
      formula="Cash Conversion = Cash from Operating Activity ÷ Net Profit"
      bands={[
        { tone: 'bad', value: 'Below 0.7', label: 'Investigate' },
        { tone: 'caution', value: '0.7 – 1.0', label: 'Acceptable' },
        { tone: 'good', value: 'Above 1.0', label: 'Profits are real' },
      ]}
      example="You bill ₹50,000 of freelance work and ₹48,000 actually lands in your account — that's 0.96, the profit is real. If only ₹30,000 showed up and the rest sat in unpaid invoices, that's 0.6 — good on paper, thin in the bank."
      body="A single low year can just be timing — an invoice that clears a week late. The real signal is a ratio that stays below 0.7 across several years running. The Self-Funded column alongside reads a related, sharper question off the same figures: does operating cash alone cover what was spent growing the business, without needing outside financing?"
    />
  )
}
