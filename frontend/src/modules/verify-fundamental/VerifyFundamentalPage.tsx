import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Icon } from '../../shared/components/Icon'
import { PageHeader } from '../../shared/components/PageHeader'
import { SideBadge } from '../../shared/components/SideBadge'
import { formatDateTime } from '../../shared/utils/format'
import { AsOfPicker } from './components/AsOfPicker'
import { AsOfYearPicker } from './components/AsOfYearPicker'
import { Code33Explainer } from './components/Code33Explainer'
import { Code33Summary } from './components/Code33Summary'
import { DebtEquityExplainer } from './components/DebtEquityExplainer'
import { DebtEquityGrid } from './components/DebtEquityGrid'
import { FundamentalsTabs, type FundamentalsTab } from './components/FundamentalsTabs'
import { QuarterlyGrid } from './components/QuarterlyGrid'
import { useVerifyFundamental } from './hooks/useVerifyFundamental'
import './VerifyFundamentalPage.css'

export function VerifyFundamentalPage() {
  const { id } = useParams<{ id: string }>()
  const {
    item,
    loading,
    error,
    asOfPeriod,
    setAsOfPeriod,
    rows,
    showEarlierQuarters,
    updateQuarter,
    code33,
    debtEquityAsOfYear,
    setDebtEquityAsOfYear,
    deYears,
    showEarlierDebtEquityYears,
    updateDebtEquityYear,
    saveStatus,
    savedAt,
  } = useVerifyFundamental(id ?? '')
  const [activeTab, setActiveTab] = useState<FundamentalsTab>('code33')

  return (
    <section className="verify-fundamental-page">
      <PageHeader
        icon="bars"
        title="Verify Fundamental"
        subtitle="Type in quarterly Sales, Net Profit and EPS — growth %, margins and the Code 33 rating are worked out for you."
        actions={<Code33Explainer />}
      />

      {loading && <p className="verify-fundamental-page__state">Loading…</p>}

      {error && (
        <p className="verify-fundamental-page__state verify-fundamental-page__state--error">
          Couldn’t load the watchlist: {error}.
        </p>
      )}

      {!loading && !error && !item && (
        <div className="verify-fundamental-page__state">
          <p>That watchlist item doesn't exist (maybe it was already placed or removed).</p>
          <Link to="/watchlist" className="verify-fundamental-page__back-link">
            ← Back to Watchlist
          </Link>
        </div>
      )}

      {!loading && !error && item && (
        <div className="verify-fundamental-page__card">
          <div className="verify-fundamental-page__title">
            <div className="verify-fundamental-page__title-meta">
              <SideBadge side={item.side} />
              <span className="verify-fundamental-page__symbol">{item.symbol}</span>
              <Code33Summary rating={code33} />
            </div>
            {activeTab === 'code33' && (
              <label className="verify-fundamental-page__as-of">
                As of
                <AsOfPicker value={asOfPeriod} onChange={setAsOfPeriod} />
              </label>
            )}
            {activeTab === 'debt-equity' && (
              <label className="verify-fundamental-page__as-of">
                As of
                <AsOfYearPicker value={debtEquityAsOfYear} onChange={setDebtEquityAsOfYear} />
              </label>
            )}
          </div>

          <FundamentalsTabs active={activeTab} onChange={setActiveTab} />

          {activeTab === 'code33' && (
            <>
              {rows.length > 0 && (
                <button
                  type="button"
                  className="verify-fundamental-page__earlier"
                  onClick={showEarlierQuarters}
                >
                  <Icon name="chevronLeft" size={13} />
                  Show 4 earlier quarters
                </button>
              )}

              <QuarterlyGrid rows={rows} rating={code33} onChange={updateQuarter} />
            </>
          )}

          {activeTab === 'debt-equity' && (
            <>
              <DebtEquityExplainer />

              {deYears.length > 0 && (
                <button
                  type="button"
                  className="verify-fundamental-page__earlier"
                  onClick={showEarlierDebtEquityYears}
                >
                  <Icon name="chevronLeft" size={13} />
                  Show 5 earlier years
                </button>
              )}

              <DebtEquityGrid rows={deYears} onChange={updateDebtEquityYear} />
            </>
          )}

          <div className="verify-fundamental-page__footer">
            <Link to="/watchlist" className="verify-fundamental-page__cancel">
              ← Back to Watchlist
            </Link>
            {saveStatus !== 'idle' && (
              <span className="verify-fundamental-page__save-status">
                {saveStatus === 'saving' || !savedAt ? 'Saving…' : `Saved · ${formatDateTime(savedAt)}`}
              </span>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
