import { Icon } from '../../../shared/components/Icon'
import { Modal } from '../../../shared/components/Modal'
import { avatarColor } from '../../../shared/utils/avatarColor'
import { formatDate, formatSignedCurrency, formatSignedPercent } from '../../../shared/utils/format'
import type { ExitedWatchlistItem } from '../types/exitedWatchlistItem'
import {
  baseLabel,
  BREAKOUT_CONFIRMATION_CHECKLIST_ITEMS,
  computeContractionPercent,
  computeRisk,
  computeWeeksInBase,
  DRAFT_STEPS,
  formatRiskRewardRatio,
  INDICATOR_CHECKLIST_ITEMS,
  OVERHEAD_SUPPLY_CHECKLIST_ITEMS,
  stageLabel,
} from '../utils/exitedDraftHelpers'
import './ExitedDraftModal.css'

interface ExitedDraftModalProps {
  /** The item whose parked draft is open — `null` keeps the popup closed. */
  item: ExitedWatchlistItem | null
  onClose: () => void
}

function ChecklistRows({
  items,
  checked,
}: {
  items: { id: string; label: string }[]
  checked: Record<string, boolean>
}) {
  return (
    <ul className="exited-draft-modal__checklist">
      {items.map((c) => (
        <li key={c.id} className={checked[c.id] ? 'is-checked' : 'is-unchecked'}>
          <Icon name={checked[c.id] ? 'check' : 'x'} size={13} />
          {c.label}
        </li>
      ))}
    </ul>
  )
}

/** Read-only summary of the place-trade stepper run that was parked against the item before
 * it was exited — what was typed, not a re-judged rating (a draft's rating was always a live,
 * unfrozen read; see drafts.spec.md). Only renders sections the draft actually reached
 * (`draft.stepIndex`), so an early-abandoned draft doesn't read as a wall of empty fields.
 * No resume action: the watchlist item behind it is gone. */
export function ExitedDraftModal({ item, onClose }: ExitedDraftModalProps) {
  const draft = item?.draft
  const reached = draft?.stepIndex ?? 0
  const risk = item && draft ? computeRisk(item.side, draft.tradeParams) : null
  const ratioTone = risk?.riskRewardRatio !== null && (risk?.riskRewardRatio ?? 0) >= 2 ? 'good' : 'default'
  const notReached = draft ? DRAFT_STEPS.slice(reached + 1).map((s) => s.title) : []

  return (
    <Modal open={item !== null} onClose={onClose} width={640} labelledBy="exited-draft-title">
      {item && draft && risk && (
        <>
          <div className="exited-draft-modal__head">
            <span
              className="exited-draft-modal__avatar"
              style={{ background: avatarColor(item.symbol) }}
              aria-hidden="true"
            >
              {item.symbol.slice(0, 2)}
            </span>
            <div>
              <h3 id="exited-draft-title" className="exited-draft-modal__symbol">
                {item.symbol}
              </h3>
              <p className="exited-draft-modal__sub">
                Parked at step {reached + 1} of {DRAFT_STEPS.length} — {DRAFT_STEPS[reached].title}
              </p>
            </div>
          </div>

          <section className="exited-draft-modal__section">
            <h4>Trade Setup</h4>
            <div className="exited-draft-modal__risk-hero">
              <div className="exited-draft-modal__risk-cell exited-draft-modal__risk-cell--critical">
                <span className="exited-draft-modal__risk-label">If stopped out</span>
                <span className="exited-draft-modal__risk-value">
                  {risk.riskPercent === null ? '—' : formatSignedPercent(-Math.abs(risk.riskPercent))}
                </span>
                <span className="exited-draft-modal__risk-sub">
                  {risk.riskAmount === null ? '—' : formatSignedCurrency(-Math.abs(risk.riskAmount))}
                </span>
              </div>
              <div className="exited-draft-modal__risk-cell exited-draft-modal__risk-cell--good">
                <span className="exited-draft-modal__risk-label">If target hit</span>
                <span className="exited-draft-modal__risk-value">
                  {risk.rewardPercent === null
                    ? '—'
                    : formatSignedPercent(Math.abs(risk.rewardPercent))}
                </span>
                <span className="exited-draft-modal__risk-sub">
                  {risk.rewardAmount === null ? '—' : formatSignedCurrency(Math.abs(risk.rewardAmount))}
                </span>
              </div>
            </div>
            <div className="exited-draft-modal__grid">
              <div>
                <span>Entry</span>
                <strong>{draft.tradeParams.entryPrice || '—'}</strong>
              </div>
              <div>
                <span>Stop</span>
                <strong>{draft.tradeParams.stopLoss || '—'}</strong>
              </div>
              <div>
                <span>Target</span>
                <strong>{draft.tradeParams.target || '—'}</strong>
              </div>
              <div>
                <span>Quantity</span>
                <strong>{draft.tradeParams.quantity || '—'}</strong>
              </div>
              <div>
                <span>Entry date</span>
                <strong>
                  {draft.tradeParams.entryDate ? formatDate(draft.tradeParams.entryDate) : '—'}
                </strong>
              </div>
              <div>
                <span>Risk : Reward</span>
                <strong className={`is-${ratioTone}`}>
                  {formatRiskRewardRatio(risk.riskRewardRatio)}
                </strong>
              </div>
            </div>
          </section>

          {reached >= 1 && (
            <section className="exited-draft-modal__section">
              <h4>Stage &amp; Base</h4>
              <div className="exited-draft-modal__grid">
                <div>
                  <span>Stage</span>
                  <strong>{stageLabel(draft.stageBaseAnswers.stage) ?? '—'}</strong>
                </div>
                <div>
                  <span>Base</span>
                  <strong>{baseLabel(draft.stageBaseAnswers.base) ?? '—'}</strong>
                </div>
              </div>
            </section>
          )}

          {reached >= 2 && (
            <section className="exited-draft-modal__section">
              <h4>Technical Confirmation</h4>
              <div className="exited-draft-modal__grid">
                <div>
                  <span>RSI</span>
                  <strong>{draft.indicatorData.rsi || '—'}</strong>
                </div>
                <div>
                  <span>50-day MA</span>
                  <strong>{draft.indicatorData.fiftyDayMa || '—'}</strong>
                </div>
              </div>
              <ChecklistRows
                items={INDICATOR_CHECKLIST_ITEMS}
                checked={draft.indicatorChecklistChecked}
              />
            </section>
          )}

          {reached >= 3 && (
            <section className="exited-draft-modal__section">
              <h4>52-Week Range</h4>
              <div className="exited-draft-modal__grid">
                <div>
                  <span>Low</span>
                  <strong>{draft.indicatorData.week52Low || '—'}</strong>
                </div>
                <div>
                  <span>High</span>
                  <strong>{draft.indicatorData.week52High || '—'}</strong>
                </div>
              </div>
            </section>
          )}

          {reached >= 4 && (
            <section className="exited-draft-modal__section">
              <h4>VCP Structure</h4>
              <div className="exited-draft-modal__grid">
                <div>
                  <span>Base started</span>
                  <strong>
                    {draft.vcpStructureData.baseStartDate
                      ? formatDate(draft.vcpStructureData.baseStartDate)
                      : '—'}
                  </strong>
                </div>
                <div>
                  <span>Base ended</span>
                  <strong>
                    {draft.vcpStructureData.baseEndDate
                      ? formatDate(draft.vcpStructureData.baseEndDate)
                      : '—'}
                  </strong>
                </div>
                <div>
                  <span>Weeks in base</span>
                  <strong>
                    {computeWeeksInBase(
                      draft.vcpStructureData.baseStartDate,
                      draft.vcpStructureData.baseEndDate,
                    ) ?? '—'}
                  </strong>
                </div>
              </div>
              {draft.vcpStructureData.contractions.some((c) => c.high || c.low) && (
                <ul className="exited-draft-modal__contractions">
                  {draft.vcpStructureData.contractions.map((c, i) => {
                    const pct = computeContractionPercent(c)
                    return (
                      <li key={i}>
                        <span>T{i + 1}</span>
                        <span>
                          {c.high || '—'} → {c.low || '—'}
                        </span>
                        <span>{pct !== null ? `${pct.toFixed(1)}%` : '—'}</span>
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>
          )}

          {reached >= 5 && (
            <section className="exited-draft-modal__section">
              <h4>Final Checks</h4>
              <p className="exited-draft-modal__subheading">Overhead Supply</p>
              <ChecklistRows
                items={OVERHEAD_SUPPLY_CHECKLIST_ITEMS}
                checked={draft.finalChecksChecked}
              />
              <p className="exited-draft-modal__subheading">Breakout Confirmation</p>
              <ChecklistRows
                items={BREAKOUT_CONFIRMATION_CHECKLIST_ITEMS}
                checked={draft.finalChecksChecked}
              />
            </section>
          )}

          {notReached.length > 0 && (
            <p className="exited-draft-modal__not-reached">Didn't reach: {notReached.join(', ')}.</p>
          )}
        </>
      )}
    </Modal>
  )
}
