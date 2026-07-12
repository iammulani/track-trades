import { HoverCard } from '../../../shared/components/HoverCard'
import { Icon } from '../../../shared/components/Icon'
import { formatPercent } from '../../../shared/utils/format'
import {
  MAX_VCP_CONTRACTIONS,
  MIN_VCP_CONTRACTIONS,
  type VcpContraction,
  type VcpStructureData,
} from '../types/placeTrade'
import {
  computeContractionPercent,
  contractionTightnessTone,
  largestCorrectionPercent,
  narrowestPullbackPercent,
  weeksInBaseTone,
} from '../utils/finalChecksCalc'
import './VcpStructureStep.css'

interface VcpStructureStepProps {
  data: VcpStructureData
  onChange: (data: VcpStructureData) => void
}

export function VcpStructureStep({ data, onChange }: VcpStructureStepProps) {
  function setWeeksInBase(value: string) {
    onChange({ ...data, weeksInBase: value })
  }

  function updateContraction(index: number, field: keyof VcpContraction, value: string) {
    const contractions = data.contractions.map((c, i) =>
      i === index ? { ...c, [field]: value } : c,
    )
    onChange({ ...data, contractions })
  }

  function addContraction() {
    if (data.contractions.length >= MAX_VCP_CONTRACTIONS) return
    onChange({ ...data, contractions: [...data.contractions, { high: '', low: '' }] })
  }

  function removeContraction(index: number) {
    if (data.contractions.length <= MIN_VCP_CONTRACTIONS) return
    onChange({ ...data, contractions: data.contractions.filter((_, i) => i !== index) })
  }

  const largest = largestCorrectionPercent(data.contractions)
  const narrowest = narrowestPullbackPercent(data.contractions)

  return (
    <div className="vcp-structure-step">
      <div className="vcp-structure-step__section-header">
        <div className="vcp-structure-step__heading-row">
          <h3>VCP Structure</h3>
          <HoverCard label="See a worked VCP example" trigger={<Icon name="info" size={12} />}>
            <div className="vcp-structure-details">
              <div className="vcp-structure-details__heading">
                Example — Meridian Bioscience Inc. (VIVO)
                <span className="vcp-structure-details__source">p. 202</span>
              </div>

              <div className="vcp-structure-details__section">
                <span className="vcp-structure-details__section-title">
                  <Icon name="waves" size={12} /> Four tightening contractions
                </span>
                <ul>
                  <li>
                    The first pullback started in April 2006, when the stock declined from $19 a
                    share to $13, correcting 31% from high to low.
                  </li>
                  <li>
                    The stock then moved higher and consolidated again, falling from just under
                    $17 to below $14 a share for a 17% pullback.
                  </li>
                  <li>
                    After the second pullback, the stock rallied once again, this time just above
                    $17 a share, and then pulled back to below $16 — a much tighter price range of
                    about 8%.
                  </li>
                  <li>
                    Finally, a short and narrow pullback of just 3% over two weeks on very low
                    volume formed the pivot buy point.
                  </li>
                </ul>
              </div>

              <div className="vcp-structure-details__section">
                <span className="vcp-structure-details__section-title">
                  <Icon name="check" size={12} /> Why it worked
                </span>
                <ul>
                  <li>
                    After putting in four Ts with successive decreases in price volatility and
                    volume, the stock price was primed to spike if buyers came in demanding
                    inventory.
                  </li>
                </ul>
              </div>
            </div>
          </HoverCard>
        </div>
        <p>Capture the shape of the base — time, price, and symmetry.</p>
      </div>

      <div className="vcp-structure-step__block">
        <span className="vcp-structure-step__label">Time</span>
        <p className="vcp-structure-step__question">
          How many weeks have passed since the base started?
        </p>
        <label
          className={`vcp-structure-step__field vcp-structure-step__field--${weeksInBaseTone(data.weeksInBase)}`}
        >
          <span className="vcp-structure-step__input-label">Weeks in base</span>
          <input
            type="number"
            min="0"
            step="1"
            className="vcp-structure-step__input"
            value={data.weeksInBase}
            onChange={(e) => setWeeksInBase(e.target.value)}
            placeholder="0"
          />
        </label>
        <p className="vcp-structure-step__note">
          A textbook base typically runs 5 to 26 weeks — much shorter and there hasn't been enough
          time to shake out weak holders; much longer and the setup may be losing its edge.
        </p>
      </div>

      <div className="vcp-structure-step__divider" />

      <div className="vcp-structure-step__block">
        <span className="vcp-structure-step__label">Price &amp; Symmetry</span>
        <p className="vcp-structure-step__question">
          Capture each contraction's high and low — at least {MIN_VCP_CONTRACTIONS}, up to{' '}
          {MAX_VCP_CONTRACTIONS}. The % pullback is calculated for you; each one should generally
          be tighter than the last.
        </p>

        <div className="vcp-structure-step__contractions">
          {data.contractions.map((contraction, index) => {
            const percent = computeContractionPercent(contraction)
            const tone = contractionTightnessTone(data.contractions, index)
            return (
              <div className="vcp-structure-step__contraction" key={index}>
                <span className="vcp-structure-step__contraction-label">T{index + 1}</span>
                <label className="vcp-structure-step__field vcp-structure-step__field--compact">
                  <span className="vcp-structure-step__input-label">High</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="vcp-structure-step__input"
                    value={contraction.high}
                    onChange={(e) => updateContraction(index, 'high', e.target.value)}
                    placeholder="0.00"
                  />
                </label>
                <label className="vcp-structure-step__field vcp-structure-step__field--compact">
                  <span className="vcp-structure-step__input-label">Low</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="vcp-structure-step__input"
                    value={contraction.low}
                    onChange={(e) => updateContraction(index, 'low', e.target.value)}
                    placeholder="0.00"
                  />
                </label>
                <span
                  className={`vcp-structure-step__contraction-percent vcp-structure-step__contraction-percent--${tone}`}
                >
                  {percent === null ? '—' : formatPercent(percent)}
                  {tone === 'bad' && <Icon name="alert" size={13} />}
                </span>
                {data.contractions.length > MIN_VCP_CONTRACTIONS && (
                  <button
                    type="button"
                    className="vcp-structure-step__remove"
                    onClick={() => removeContraction(index)}
                    aria-label={`Remove T${index + 1}`}
                  >
                    <Icon name="x" size={13} />
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {data.contractions.length < MAX_VCP_CONTRACTIONS && (
          <button type="button" className="vcp-structure-step__add" onClick={addContraction}>
            <Icon name="plus" size={13} /> Add contraction
          </button>
        )}

        <div className="vcp-structure-step__summary">
          <div className="vcp-structure-step__summary-stat">
            <span className="vcp-structure-step__input-label">Largest correction</span>
            <span className="vcp-structure-step__summary-value">
              {largest === null ? '—' : formatPercent(largest)}
            </span>
          </div>
          <div className="vcp-structure-step__summary-stat">
            <span className="vcp-structure-step__input-label">Narrowest pullback</span>
            <span className="vcp-structure-step__summary-value">
              {narrowest === null ? '—' : formatPercent(narrowest)}
            </span>
          </div>
        </div>

        <p className="vcp-structure-step__note">
          Look for a largest correction in the 15–25% range and a final, right-most pullback under
          about 10% — the tighter that last contraction, the closer to a proper pivot.
        </p>
      </div>
    </div>
  )
}
