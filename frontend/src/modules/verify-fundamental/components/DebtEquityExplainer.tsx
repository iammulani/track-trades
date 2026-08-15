import { MetricExplainer } from './MetricExplainer'

/** Debt to Equity's fixed reference content, rendered through the shared `MetricExplainer` shell
 * — see that component for why this is always-expanded rather than a `HoverCard`. */
export function DebtEquityExplainer() {
  return (
    <MetricExplainer
      question="how much of this business was built with borrowed money?"
      where="Balance Sheet, annual figures."
      formula="Debt/Equity = Borrowings ÷ (Equity Capital + Reserves)"
      bands={[
        { tone: 'good', value: 'Under 0.5', label: 'Safe' },
        { tone: 'caution', value: '0.5 – 1.0', label: 'Watch' },
        { tone: 'bad', value: 'Over 1.0', label: 'Fragile' },
      ]}
      example="You buy a ₹1 crore flat with ₹70 lakh of savings and a ₹30 lakh loan. Your D/E is 0.43. Most of it is yours."
      body="Debt gets repaid whether the business's year is good or bad. Low debt means it survives a bad year; high debt means one bad year can end it."
    />
  )
}
