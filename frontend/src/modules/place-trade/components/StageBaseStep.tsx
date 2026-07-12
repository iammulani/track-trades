import type { KeyboardEvent } from 'react'
import { HoverCard } from '../../../shared/components/HoverCard'
import { Icon, type IconName } from '../../../shared/components/Icon'
import type { Base, Stage, StageBaseAnswers } from '../types/placeTrade'
import { BASE_OPTIONS, STAGE_OPTIONS, type RiskOption, type RiskTone } from '../utils/stageBaseOptions'
import './StageBaseStep.css'

interface StageBaseStepProps {
  answers: StageBaseAnswers
  onChange: (answers: StageBaseAnswers) => void
}

const TONE_ICON: Record<RiskTone, IconName> = {
  best: 'star',
  good: 'check',
  caution: 'alert',
  bad: 'alert',
  avoid: 'x',
}

function OptionRow<Id extends string>({
  option,
  isSelected,
  onSelect,
}: {
  option: RiskOption<Id>
  isSelected: boolean
  onSelect: () => void
}) {
  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onSelect()
    }
  }

  return (
    <div
      role="radio"
      aria-checked={isSelected}
      tabIndex={0}
      className={`risk-option risk-option--${option.tone}${isSelected ? ' is-selected' : ''}`}
      onClick={onSelect}
      onKeyDown={handleKeyDown}
    >
      <span className="risk-option__badge">
        <Icon name={TONE_ICON[option.tone]} size={14} />
      </span>

      <div className="risk-option__body">
        <div className="risk-option__title-row">
          <span className="risk-option__label">{option.label}</span>
          <span className="risk-option__verdict">{option.verdict}</span>
        </div>
        <p className="risk-option__summary">{option.summary}</p>
      </div>

      <span className="risk-option__radio" aria-hidden="true" />

      <span className="risk-option__info" onClick={(e) => e.stopPropagation()}>
        <HoverCard label={`More about ${option.label}`} trigger={<Icon name="info" size={12} />}>
          <div className="risk-option-details">
            <div className={`risk-option-details__heading risk-option-details__heading--${option.tone}`}>
              <span>{option.label}</span>
              <span className="risk-option-details__verdict">{option.verdict}</span>
            </div>

            {option.detailSections.map((section) => (
              <div className="risk-option-details__section" key={section.heading}>
                <span className="risk-option-details__section-title">
                  <Icon name={section.icon} size={12} /> {section.heading}
                </span>
                {section.points.length === 1 ? (
                  <p>{section.points[0]}</p>
                ) : (
                  <ul>
                    {section.points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </HoverCard>
      </span>
    </div>
  )
}

export function StageBaseStep({ answers, onChange }: StageBaseStepProps) {
  return (
    <div className="stage-base-step">
      <section className="stage-base-step__section">
        <div className="stage-base-step__section-header">
          <h3>Stage</h3>
          <p>Where is this stock in its overall trend? Pick the one that matches right now.</p>
        </div>
        <div className="stage-base-step__options" role="radiogroup" aria-label="Stage">
          {STAGE_OPTIONS.map((option) => (
            <OptionRow<Stage>
              key={option.id}
              option={option}
              isSelected={answers.stage === option.id}
              onSelect={() => onChange({ ...answers, stage: option.id })}
            />
          ))}
        </div>
      </section>

      <section className="stage-base-step__section">
        <div className="stage-base-step__section-header">
          <h3>Base</h3>
          <p>How does the base it's breaking out of (or basing in) look?</p>
        </div>
        <div className="stage-base-step__options" role="radiogroup" aria-label="Base">
          {BASE_OPTIONS.map((option) => (
            <OptionRow<Base>
              key={option.id}
              option={option}
              isSelected={answers.base === option.id}
              onSelect={() => onChange({ ...answers, base: option.id })}
            />
          ))}
        </div>
      </section>
    </div>
  )
}
