import './FundamentalsTabs.css'

export type FundamentalsTab = 'code33' | 'debt-equity' | 'interest-coverage' | 'cash-conversion'

const TABS: { value: FundamentalsTab; label: string }[] = [
  { value: 'code33', label: 'Code 33' },
  { value: 'debt-equity', label: 'Debt to Equity' },
  { value: 'interest-coverage', label: 'Interest Coverage' },
  { value: 'cash-conversion', label: 'Cash Conversion' },
]

interface FundamentalsTabsProps {
  active: FundamentalsTab
  onChange: (tab: FundamentalsTab) => void
}

/** Bespoke tab bar — no shared generic tab component exists yet in `shared/components/` — same
 * hand-rolled role="radiogroup"-style pattern `AddTickerModal`'s side/category pickers use, just
 * with tab semantics. All four planned metrics are wired up now: Code 33, Debt to Equity,
 * Interest Coverage, and Cash Conversion (which also carries the Self-Funded bonus flag — see
 * `CashConversionGrid` — rather than getting a tab of its own). */
export function FundamentalsTabs({ active, onChange }: FundamentalsTabsProps) {
  return (
    <div className="fundamentals-tabs" role="tablist" aria-label="Fundamentals section">
      {TABS.map((tab) => (
        <button
          key={tab.value}
          type="button"
          role="tab"
          aria-selected={active === tab.value}
          className={`fundamentals-tabs__tab${active === tab.value ? ' is-active' : ''}`}
          onClick={() => onChange(tab.value)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
