import { Icon } from '../../../shared/components/Icon'
import { SideBadge } from '../../../shared/components/SideBadge'
import { avatarColor } from '../../../shared/utils/avatarColor'
import { formatPercent, formatPrice, formatSignedPercent } from '../../../shared/utils/format'
import type { WatchlistItemWithMetrics } from '../../watchlist'
import type {
  ChecklistChecked,
  IndicatorData,
  StageBaseAnswers,
  TradeParams,
  VcpStructureData,
} from '../types/placeTrade'
import {
  filledContractionCount,
  largestCorrectionPercent,
  narrowestPullbackPercent,
} from '../utils/finalChecksCalc'
import {
  BREAKOUT_CONFIRMATION_CHECKLIST_ITEMS,
  OVERHEAD_SUPPLY_CHECKLIST_ITEMS,
} from '../utils/finalChecksItems'
import { computeIndicatorRange, computeMaDistancePercent } from '../utils/indicatorCalc'
import { INDICATOR_CHECKLIST_ITEMS } from '../utils/indicatorChecklistItems'
import { BASE_OPTIONS, STAGE_OPTIONS } from '../utils/stageBaseOptions'
import {
  CRITERION_STATE_ICON,
  criterionPoints,
  criterionState,
  formatPoints,
  formatStars,
  RATING_STARS,
  ratingVerdict,
  type TradeRating,
} from '../utils/tradeRating'
import { RatingGateBanner } from './RatingGateBanner'
import { RatingStars } from './RatingStars'
import { RiskSummary } from './RiskSummary'
import './ReviewStep.css'

interface ReviewStepProps {
  item: WatchlistItemWithMetrics
  tradeParams: TradeParams
  stageBaseAnswers: StageBaseAnswers
  indicatorData: IndicatorData
  indicatorChecklistChecked: ChecklistChecked
  finalChecksChecked: ChecklistChecked
  vcpStructureData: VcpStructureData
  rating: TradeRating
}

export function ReviewStep({
  item,
  tradeParams,
  stageBaseAnswers,
  indicatorData,
  indicatorChecklistChecked,
  finalChecksChecked,
  vcpStructureData,
  rating,
}: ReviewStepProps) {
  const verdict = ratingVerdict(rating.ratio)
  const stage = STAGE_OPTIONS.find((s) => s.id === stageBaseAnswers.stage)
  const base = BASE_OPTIONS.find((b) => b.id === stageBaseAnswers.base)
  const indicatorCheckedCount = INDICATOR_CHECKLIST_ITEMS.filter(
    (c) => indicatorChecklistChecked[c.id],
  ).length
  const finalChecksCheckedCount = OVERHEAD_SUPPLY_CHECKLIST_ITEMS.filter(
    (c) => finalChecksChecked[c.id],
  ).length
  const breakoutConfirmationCheckedCount = BREAKOUT_CONFIRMATION_CHECKLIST_ITEMS.filter(
    (c) => finalChecksChecked[c.id],
  ).length
  const range = computeIndicatorRange(
    tradeParams.entryPrice,
    indicatorData.week52Low,
    indicatorData.week52High,
  )
  const maDistance = computeMaDistancePercent(tradeParams.entryPrice, indicatorData.fiftyDayMa)
  const largest = largestCorrectionPercent(vcpStructureData.contractions)
  const narrowest = narrowestPullbackPercent(vcpStructureData.contractions)
  const contractionCount = filledContractionCount(vcpStructureData.contractions)

  return (
    <div className="review-step">
      <div className="review-step__header">
        <span
          className="review-step__avatar"
          style={{ background: avatarColor(item.symbol) }}
          aria-hidden="true"
        >
          {item.symbol.slice(0, 2)}
        </span>
        <div>
          <div className="review-step__symbol">{item.symbol}</div>
          <SideBadge side={item.side} />
        </div>
      </div>

      <div className={`review-step__rating review-step__rating--${verdict.tone}`}>
        <RatingStars ratio={rating.ratio} size={22} />
        <div className="review-step__rating-text">
          <span className="review-step__rating-score">
            {formatStars(rating.stars)} / {RATING_STARS}
          </span>
          <span className="review-step__rating-verdict">{verdict.label}</span>
        </div>
      </div>

      <RatingGateBanner rating={rating} />

      <div className="review-step__section">
        <span className="review-step__section-title">
          Why {Math.round(rating.rawRatio * 100)}% on points? — {formatPoints(rating.earnedWeight)} of{' '}
          {formatPoints(rating.totalWeight)}
        </span>
        <ul className="review-step__breakdown">
          {rating.criteria.map((c) => {
            const state = criterionState(c)
            return (
              <li key={c.id} className={`review-step__breakdown-row is-${state}`}>
                <Icon name={CRITERION_STATE_ICON[state]} size={14} />
                <span className="review-step__breakdown-label">{c.label}</span>
                <span className="review-step__breakdown-points">
                  {formatPoints(criterionPoints(c))}/{formatPoints(c.weight)}
                </span>
              </li>
            )
          })}
        </ul>
      </div>

      <div className="review-step__grid">
        <div className="review-step__stat">
          <span className="review-step__stat-label">Entry</span>
          <span className="review-step__stat-value">
            {formatPrice(Number(tradeParams.entryPrice))}
          </span>
        </div>
        <div className="review-step__stat">
          <span className="review-step__stat-label">Quantity</span>
          <span className="review-step__stat-value">{tradeParams.quantity}</span>
        </div>
        <div className="review-step__stat">
          <span className="review-step__stat-label">Stop loss</span>
          <span className="review-step__stat-value">
            {tradeParams.stopLoss ? formatPrice(Number(tradeParams.stopLoss)) : '—'}
          </span>
        </div>
        <div className="review-step__stat">
          <span className="review-step__stat-label">Target</span>
          <span className="review-step__stat-value">
            {tradeParams.target ? formatPrice(Number(tradeParams.target)) : '—'}
          </span>
        </div>
      </div>

      <RiskSummary side={item.side} params={tradeParams} />

      <div className="review-step__section">
        <span className="review-step__section-title">Stage & Base</span>
        <div className="review-step__stage-base">
          <div className="review-step__stage-base-item">
            <span className="review-step__stage-base-label">Stage</span>
            <span className={`review-step__stage-base-value review-step__stage-base-value--${stage?.tone ?? 'none'}`}>
              {stage ? `${stage.label} — ${stage.verdict}` : '—'}
            </span>
          </div>
          <div className="review-step__stage-base-item">
            <span className="review-step__stage-base-label">Base</span>
            <span className={`review-step__stage-base-value review-step__stage-base-value--${base?.tone ?? 'none'}`}>
              {base ? `${base.label} — ${base.verdict}` : '—'}
            </span>
          </div>
        </div>
      </div>

      <div className="review-step__section">
        <span className="review-step__section-title">
          Indicators — {indicatorCheckedCount}/{INDICATOR_CHECKLIST_ITEMS.length} confirmed
        </span>
        <div className="review-step__grid">
          <div className="review-step__stat">
            <span className="review-step__stat-label">RSI</span>
            <span className="review-step__stat-value">{indicatorData.rsi || '—'}</span>
          </div>
          <div className="review-step__stat">
            <span className="review-step__stat-label">50-day MA</span>
            <span className="review-step__stat-value">
              {indicatorData.fiftyDayMa ? formatPrice(Number(indicatorData.fiftyDayMa)) : '—'}
            </span>
          </div>
          <div className="review-step__stat">
            <span className="review-step__stat-label">From 50-day MA</span>
            <span className="review-step__stat-value">
              {maDistance === null ? '—' : formatSignedPercent(maDistance)}
            </span>
          </div>
          <div className="review-step__stat">
            <span className="review-step__stat-label">Above 52-wk low</span>
            <span className="review-step__stat-value">
              {range.aboveLowPercent === null ? '—' : formatPercent(range.aboveLowPercent)}
            </span>
          </div>
          <div className="review-step__stat">
            <span className="review-step__stat-label">Below 52-wk high</span>
            <span className="review-step__stat-value">
              {range.belowHighPercent === null ? '—' : formatPercent(range.belowHighPercent)}
            </span>
          </div>
        </div>
      </div>

      <div className="review-step__section">
        <span className="review-step__section-title">VCP Structure</span>
        <div className="review-step__grid">
          <div className="review-step__stat">
            <span className="review-step__stat-label">Weeks in base</span>
            <span className="review-step__stat-value">{vcpStructureData.weeksInBase || '—'}</span>
          </div>
          <div className="review-step__stat">
            <span className="review-step__stat-label">Largest correction</span>
            <span className="review-step__stat-value">
              {largest === null ? '—' : formatPercent(largest)}
            </span>
          </div>
          <div className="review-step__stat">
            <span className="review-step__stat-label">Narrowest pullback</span>
            <span className="review-step__stat-value">
              {narrowest === null ? '—' : formatPercent(narrowest)}
            </span>
          </div>
          <div className="review-step__stat">
            <span className="review-step__stat-label">Contractions</span>
            <span className="review-step__stat-value">{contractionCount || '—'}</span>
          </div>
        </div>
      </div>

      <div className="review-step__section">
        <span className="review-step__section-title">
          Overhead Supply — {finalChecksCheckedCount}/{OVERHEAD_SUPPLY_CHECKLIST_ITEMS.length}{' '}
          confirmed
        </span>
        <ul className="review-step__checklist">
          {OVERHEAD_SUPPLY_CHECKLIST_ITEMS.map((c) => (
            <li key={c.id} className={finalChecksChecked[c.id] ? 'is-checked' : 'is-unchecked'}>
              {c.label}
            </li>
          ))}
        </ul>
      </div>

      <div className="review-step__section">
        <span className="review-step__section-title">
          Breakout Confirmation — {breakoutConfirmationCheckedCount}/
          {BREAKOUT_CONFIRMATION_CHECKLIST_ITEMS.length} confirmed
        </span>
        <ul className="review-step__checklist">
          {BREAKOUT_CONFIRMATION_CHECKLIST_ITEMS.map((c) => (
            <li key={c.id} className={finalChecksChecked[c.id] ? 'is-checked' : 'is-unchecked'}>
              {c.label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
