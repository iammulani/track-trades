import type { EdgeAnswers } from '../types/placeTrade'
import './EdgeStep.css'

interface EdgeStepProps {
  answers: EdgeAnswers
  onChange: (answers: EdgeAnswers) => void
}

export function EdgeStep({ answers, onChange }: EdgeStepProps) {
  return (
    <div className="edge-step">
      <label className="edge-step__field" htmlFor="edge-thesis">
        <span className="edge-step__label">What's your edge? Why does this setup work?</span>
        <textarea
          id="edge-thesis"
          className="edge-step__textarea"
          value={answers.thesis}
          onChange={(e) => onChange({ ...answers, thesis: e.target.value })}
          placeholder="e.g. Breaking out of a 3-week base on rising volume, sector is leading the market..."
          rows={5}
          maxLength={500}
        />
      </label>

      <div className="edge-step__field">
        <span className="edge-step__label">Does this align with your trading plan?</span>
        <div className="edge-step__toggle" role="radiogroup" aria-label="Aligned with plan">
          <button
            type="button"
            role="radio"
            aria-checked={answers.alignedWithPlan === true}
            className={`edge-step__toggle-btn${answers.alignedWithPlan === true ? ' is-active is-yes' : ''}`}
            onClick={() => onChange({ ...answers, alignedWithPlan: true })}
          >
            Yes
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={answers.alignedWithPlan === false}
            className={`edge-step__toggle-btn${answers.alignedWithPlan === false ? ' is-active is-no' : ''}`}
            onClick={() => onChange({ ...answers, alignedWithPlan: false })}
          >
            No
          </button>
        </div>
      </div>
    </div>
  )
}
