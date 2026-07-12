import { HoverCard } from '../../../shared/components/HoverCard'
import { Icon } from '../../../shared/components/Icon'
import type { VcpStructureData } from '../types/placeTrade'
import {
  contractionCountTone,
  largestCorrectionTone,
  narrowestPullbackTone,
  weeksInBaseTone,
} from '../utils/finalChecksCalc'
import './VcpStructureStep.css'

interface VcpStructureStepProps {
  data: VcpStructureData
  onChange: (data: VcpStructureData) => void
}

export function VcpStructureStep({ data, onChange }: VcpStructureStepProps) {
  function set<K extends keyof VcpStructureData>(key: K, value: string) {
    onChange({ ...data, [key]: value })
  }

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
            onChange={(e) => set('weeksInBase', e.target.value)}
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
        <span className="vcp-structure-step__label">Price</span>
        <p className="vcp-structure-step__question">
          How deep was the largest correction, and how narrow was the smallest pullback at the
          very right of the price base?
        </p>
        <div className="vcp-structure-step__grid">
          <label
            className={`vcp-structure-step__field vcp-structure-step__field--${largestCorrectionTone(data.largestCorrectionPercent)}`}
          >
            <span className="vcp-structure-step__input-label">Largest correction (%)</span>
            <input
              type="number"
              min="0"
              step="1"
              className="vcp-structure-step__input"
              value={data.largestCorrectionPercent}
              onChange={(e) => set('largestCorrectionPercent', e.target.value)}
              placeholder="0"
            />
          </label>
          <label
            className={`vcp-structure-step__field vcp-structure-step__field--${narrowestPullbackTone(data.narrowestPullbackPercent)}`}
          >
            <span className="vcp-structure-step__input-label">Narrowest pullback (%)</span>
            <input
              type="number"
              min="0"
              step="1"
              className="vcp-structure-step__input"
              value={data.narrowestPullbackPercent}
              onChange={(e) => set('narrowestPullbackPercent', e.target.value)}
              placeholder="0"
            />
          </label>
        </div>
        <p className="vcp-structure-step__note">
          Look for a largest correction in the 15–25% range and a final, right-most pullback under
          about 10% — the tighter that last contraction, the closer to a proper pivot.
        </p>
      </div>

      <div className="vcp-structure-step__divider" />

      <div className="vcp-structure-step__block">
        <span className="vcp-structure-step__label">Symmetry</span>
        <p className="vcp-structure-step__question">
          How many contractions (Ts) did the stock go through during the basing process?
        </p>
        <label
          className={`vcp-structure-step__field vcp-structure-step__field--${contractionCountTone(data.contractionCount)}`}
        >
          <span className="vcp-structure-step__input-label">Number of contractions</span>
          <input
            type="number"
            min="0"
            step="1"
            className="vcp-structure-step__input"
            value={data.contractionCount}
            onChange={(e) => set('contractionCount', e.target.value)}
            placeholder="0"
          />
        </label>
        <p className="vcp-structure-step__note">
          A healthy VCP typically shows 2 to 4 contractions, each tighter than the last. A single
          contraction hasn't really shown tightening yet, and 5 or more often means the base is
          getting choppy.
        </p>
      </div>
    </div>
  )
}
