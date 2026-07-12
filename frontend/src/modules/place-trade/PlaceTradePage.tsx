import { Link, useParams } from 'react-router-dom'
import { Icon } from '../../shared/components/Icon'
import { PageHeader } from '../../shared/components/PageHeader'
import { FinalChecksStep } from './components/FinalChecksStep'
import { ReviewStep } from './components/ReviewStep'
import { StageBaseStep } from './components/StageBaseStep'
import { StepIndicator } from './components/StepIndicator'
import { TechnicalConfirmationStep } from './components/TechnicalConfirmationStep'
import { TradeParamsStep } from './components/TradeParamsStep'
import { WeekRangeStep } from './components/WeekRangeStep'
import { usePlaceTrade } from './hooks/usePlaceTrade'
import './PlaceTradePage.css'

export function PlaceTradePage() {
  const { id } = useParams<{ id: string }>()
  const {
    item,
    loading,
    error,
    steps,
    stepIndex,
    goNext,
    goBack,
    canProceed,
    tradeParams,
    setTradeParams,
    stageBaseAnswers,
    setStageBaseAnswers,
    indicatorData,
    setIndicatorData,
    indicatorChecklistChecked,
    toggleIndicatorChecklistItem,
    finalChecksChecked,
    toggleFinalChecksItem,
    vcpStructureData,
    setVcpStructureData,
    placing,
    placeTrade,
  } = usePlaceTrade(id ?? '')

  const isFirstStep = stepIndex === 0
  const isLastStep = stepIndex === steps.length - 1

  return (
    <section className="place-trade-page">
      <PageHeader
        icon="send"
        title="Place Trade"
        subtitle="Walk through your checklist before you pull the trigger."
      />

      {loading && <p className="place-trade-page__state">Loading…</p>}

      {error && (
        <p className="place-trade-page__state place-trade-page__state--error">
          Couldn’t load the watchlist: {error}.
        </p>
      )}

      {!loading && !error && !item && (
        <div className="place-trade-page__state">
          <p>That watchlist item doesn't exist (maybe it was already placed or removed).</p>
          <Link to="/watchlist" className="place-trade-page__back-link">
            ← Back to Watchlist
          </Link>
        </div>
      )}

      {!loading && !error && item && (
        <div className="place-trade-page__card">
          <StepIndicator steps={steps} currentIndex={stepIndex} />

          <div className="place-trade-page__step-title">
            <h2>{steps[stepIndex].title}</h2>
            <span className="place-trade-page__step-symbol">{item.symbol}</span>
          </div>

          <div className="place-trade-page__step-body">
            {steps[stepIndex].id === 'setup' && (
              <TradeParamsStep side={item.side} params={tradeParams} onChange={setTradeParams} />
            )}
            {steps[stepIndex].id === 'stage-base' && (
              <StageBaseStep answers={stageBaseAnswers} onChange={setStageBaseAnswers} />
            )}
            {steps[stepIndex].id === 'technical' && (
              <TechnicalConfirmationStep
                entryPrice={tradeParams.entryPrice}
                data={indicatorData}
                onChange={setIndicatorData}
                checklistChecked={indicatorChecklistChecked}
                onToggleChecklist={toggleIndicatorChecklistItem}
              />
            )}
            {steps[stepIndex].id === 'week-range' && (
              <WeekRangeStep
                entryPrice={tradeParams.entryPrice}
                data={indicatorData}
                onChange={setIndicatorData}
              />
            )}
            {steps[stepIndex].id === 'final-checks' && (
              <FinalChecksStep
                checked={finalChecksChecked}
                onToggle={toggleFinalChecksItem}
                vcpData={vcpStructureData}
                onChangeVcpData={setVcpStructureData}
              />
            )}
            {steps[stepIndex].id === 'review' && (
              <ReviewStep
                item={item}
                tradeParams={tradeParams}
                stageBaseAnswers={stageBaseAnswers}
                indicatorData={indicatorData}
                indicatorChecklistChecked={indicatorChecklistChecked}
                finalChecksChecked={finalChecksChecked}
                vcpStructureData={vcpStructureData}
              />
            )}
          </div>

          <div className="place-trade-page__footer">
            <Link to="/watchlist" className="place-trade-page__cancel">
              Cancel
            </Link>

            <div className="place-trade-page__nav">
              {!isFirstStep && (
                <button type="button" className="place-trade-page__back" onClick={goBack}>
                  <Icon name="chevronLeft" size={16} />
                  Back
                </button>
              )}

              {!isLastStep ? (
                <button
                  type="button"
                  className="place-trade-page__next"
                  onClick={goNext}
                  disabled={!canProceed}
                >
                  Next
                  <Icon name="chevronRight" size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  className="place-trade-page__submit"
                  onClick={placeTrade}
                  disabled={placing}
                >
                  <Icon name="send" size={15} />
                  {placing ? 'Placing…' : 'Place Trade'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
