import { Icon } from '../../../shared/components/Icon'
import type { ChecklistChecked } from '../types/placeTrade'
import type { ChecklistItem } from '../utils/checklistItems'
import './ChecklistStep.css'

interface ChecklistStepProps {
  items: ChecklistItem[]
  checked: ChecklistChecked
  onToggle: (id: string) => void
}

export function ChecklistStep({ items, checked, onToggle }: ChecklistStepProps) {
  const checkedCount = items.filter((item) => checked[item.id]).length

  return (
    <div className="checklist-step">
      <p className="checklist-step__count">
        {checkedCount} of {items.length} confirmed
      </p>

      <ul className="checklist-step__list">
        {items.map((item) => {
          const isChecked = !!checked[item.id]
          return (
            <li key={item.id}>
              <button
                type="button"
                className={`checklist-step__item${isChecked ? ' is-checked' : ''}`}
                onClick={() => onToggle(item.id)}
                aria-pressed={isChecked}
              >
                <span className="checklist-step__box">
                  {isChecked && <Icon name="check" size={13} />}
                </span>
                {item.label}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
