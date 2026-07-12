import { SideBadge } from '../../../shared/components/SideBadge'
import { avatarColor } from '../../../shared/utils/avatarColor'
import { formatPrice } from '../../../shared/utils/format'
import type { WatchlistItemWithMetrics } from '../../watchlist'
import type {
  ChecklistChecked,
  EdgeAnswers,
  StageBaseAnswers,
  TradeParams,
} from '../types/placeTrade'
import { CHECKLIST_ITEMS } from '../utils/checklistItems'
import { BASE_OPTIONS, STAGE_OPTIONS } from '../utils/stageBaseOptions'
import { RiskSummary } from './RiskSummary'
import './ReviewStep.css'

interface ReviewStepProps {
  item: WatchlistItemWithMetrics
  tradeParams: TradeParams
  stageBaseAnswers: StageBaseAnswers
  edgeAnswers: EdgeAnswers
  checklistChecked: ChecklistChecked
}

export function ReviewStep({
  item,
  tradeParams,
  stageBaseAnswers,
  edgeAnswers,
  checklistChecked,
}: ReviewStepProps) {
  const checkedCount = CHECKLIST_ITEMS.filter((c) => checklistChecked[c.id]).length
  const stage = STAGE_OPTIONS.find((s) => s.id === stageBaseAnswers.stage)
  const base = BASE_OPTIONS.find((b) => b.id === stageBaseAnswers.base)

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
        <span className="review-step__section-title">Thesis</span>
        <p className="review-step__thesis">{edgeAnswers.thesis || '—'}</p>
        <span className="review-step__aligned">
          Aligned with plan:{' '}
          <strong>
            {edgeAnswers.alignedWithPlan === null
              ? '—'
              : edgeAnswers.alignedWithPlan
                ? 'Yes'
                : 'No'}
          </strong>
        </span>
      </div>

      <div className="review-step__section">
        <span className="review-step__section-title">
          Checklist — {checkedCount}/{CHECKLIST_ITEMS.length} confirmed
        </span>
        <ul className="review-step__checklist">
          {CHECKLIST_ITEMS.map((c) => (
            <li key={c.id} className={checklistChecked[c.id] ? 'is-checked' : 'is-unchecked'}>
              {c.label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
