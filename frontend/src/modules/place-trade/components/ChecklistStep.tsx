import { Icon } from '../../../shared/components/Icon'
import type { ChecklistChecked } from '../types/placeTrade'
import { CHECKLIST_ITEMS } from '../utils/checklistItems'
import './ChecklistStep.css'

interface ChecklistStepProps {
  checked: ChecklistChecked
  onToggle: (id: string) => void
}

export function ChecklistStep({ checked, onToggle }: ChecklistStepProps) {
  const checkedCount = CHECKLIST_ITEMS.filter((item) => checked[item.id]).length

  return (
    <div className="checklist-step">
      <p className="checklist-step__count">
        {checkedCount} of {CHECKLIST_ITEMS.length} confirmed
      </p>

      <ul className="checklist-step__list">
        {CHECKLIST_ITEMS.map((item) => {
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
