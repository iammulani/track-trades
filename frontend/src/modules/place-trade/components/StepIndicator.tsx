import { Icon } from '../../../shared/components/Icon'
import './StepIndicator.css'

interface StepIndicatorProps {
  steps: readonly { id: string; title: string }[]
  currentIndex: number
}

/** Progress across the stepper — done steps get a checkmark, current is highlighted. */
export function StepIndicator({ steps, currentIndex }: StepIndicatorProps) {
  return (
    <ol className="step-indicator">
      {steps.map((step, i) => {
        const state = i < currentIndex ? 'done' : i === currentIndex ? 'current' : 'upcoming'
        return (
          <li
            key={step.id}
            className={`step-indicator__item step-indicator__item--${state}`}
            title={step.title}
          >
            <span className="step-indicator__dot" aria-label={step.title}>
              {state === 'done' ? <Icon name="check" size={13} /> : i + 1}
            </span>
            {i < steps.length - 1 && <span className="step-indicator__line" />}
          </li>
        )
      })}
    </ol>
  )
}
