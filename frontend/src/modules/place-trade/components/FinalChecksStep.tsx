import { HoverCard } from '../../../shared/components/HoverCard'
import { Icon } from '../../../shared/components/Icon'
import type { ChecklistChecked, VcpStructureData } from '../types/placeTrade'
import {
  contractionCountTone,
  largestCorrectionTone,
  narrowestPullbackTone,
  weeksInBaseTone,
} from '../utils/finalChecksCalc'
import { OVERHEAD_SUPPLY_CHECKLIST_ITEMS } from '../utils/finalChecksItems'
import { ChecklistStep } from './ChecklistStep'
import './FinalChecksStep.css'

interface FinalChecksStepProps {
  checked: ChecklistChecked
  onToggle: (id: string) => void
  vcpData: VcpStructureData
  onChangeVcpData: (data: VcpStructureData) => void
}

export function FinalChecksStep({
  checked,
  onToggle,
  vcpData,
  onChangeVcpData,
}: FinalChecksStepProps) {
  function set<K extends keyof VcpStructureData>(key: K, value: string) {
    onChangeVcpData({ ...vcpData, [key]: value })
  }

  return (
    <div className="final-checks-step">
      <section className="final-checks-step__section">
        <div className="final-checks-step__section-header">
          <div className="final-checks-step__heading-row">
            <h3>Overhead Supply</h3>
            <HoverCard label="More about overhead supply" trigger={<Icon name="info" size={12} />}>
              <div className="final-checks-details">
                <div className="final-checks-details__heading">Overhead Supply</div>

                <div className="final-checks-details__section">
                  <span className="final-checks-details__section-title">
                    <Icon name="arrowDownRight" size={12} /> Where supply comes from
                  </span>
                  <ul>
                    <li>
                      Trapped buyers who bought near the previous high are sitting on losses and
                      sell into rallies just to break even.
                    </li>
                    <li>
                      Bottom-fishers who bought cheap are now sitting on profits and take some off
                      the table as the stock nears its old high.
                    </li>
                    <li>Together, this creates the price pullback on the right side of the base.</li>
                  </ul>
                </div>

                <div className="final-checks-details__section">
                  <span className="final-checks-details__section-title">
                    <Icon name="waves" size={12} /> What a healthy VCP looks like
                  </span>
                  <ul>
                    <li>
                      If the stock is being accumulated by institutions, each contraction gets
                      smaller from left to right as supply is absorbed by bigger players.
                    </li>
                    <li>
                      That tightening is simply supply and demand at work — the stock changing
                      hands in an orderly way.
                    </li>
                  </ul>
                </div>

                <div className="final-checks-details__section">
                  <span className="final-checks-details__section-title">
                    <Icon name="clock" size={12} /> Be patient
                  </span>
                  <ul>
                    <li>
                      Wait for the stock to go through its normal process of shares moving from
                      weak holders to strong ones.
                    </li>
                    <li>
                      As a trader using a stop loss, you're a weak holder too — you want the other
                      weak holders to exit before you buy.
                    </li>
                    <li>
                      Waiting for this also keeps you out of a crowded trade, since it means the
                      stock is largely off the public's radar.
                    </li>
                  </ul>
                </div>

                <div className="final-checks-details__section">
                  <span className="final-checks-details__section-title">
                    <Icon name="alert" size={12} /> Warning sign
                  </span>
                  <ul>
                    <li>
                      Evidence supply has dried up: trading volume contracts significantly and
                      price action quiets down noticeably.
                    </li>
                    <li>
                      If price and volume don't quiet down on the right side of the base, supply is
                      likely still coming to market — the stock is too risky.
                    </li>
                  </ul>
                </div>
              </div>
            </HoverCard>
          </div>
          <p>Confirm supply has been absorbed before you buy into strength.</p>
        </div>
        <ChecklistStep
          items={OVERHEAD_SUPPLY_CHECKLIST_ITEMS}
          checked={checked}
          onToggle={onToggle}
        />
      </section>

      <section className="final-checks-step__section">
        <div className="final-checks-step__section-header">
          <div className="final-checks-step__heading-row">
            <h3>VCP Structure</h3>
            <HoverCard label="See a worked VCP example" trigger={<Icon name="info" size={12} />}>
              <div className="final-checks-details">
                <div className="final-checks-details__heading">
                  Example — Meridian Bioscience Inc. (VIVO)
                  <span className="final-checks-details__source">p. 202</span>
                </div>

                <div className="final-checks-details__section">
                  <span className="final-checks-details__section-title">
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
                      After the second pullback, the stock rallied once again, this time just
                      above $17 a share, and then pulled back to below $16 — a much tighter price
                      range of about 8%.
                    </li>
                    <li>
                      Finally, a short and narrow pullback of just 3% over two weeks on very low
                      volume formed the pivot buy point.
                    </li>
                  </ul>
                </div>

                <div className="final-checks-details__section">
                  <span className="final-checks-details__section-title">
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

        <div className="final-checks-step__vcp-block">
          <span className="final-checks-step__vcp-label">Time</span>
          <p className="final-checks-step__vcp-question">
            How many weeks have passed since the base started?
          </p>
          <label
            className={`final-checks-step__field final-checks-step__field--${weeksInBaseTone(vcpData.weeksInBase)}`}
          >
            <span className="final-checks-step__input-label">Weeks in base</span>
            <input
              type="number"
              min="0"
              step="1"
              className="final-checks-step__input"
              value={vcpData.weeksInBase}
              onChange={(e) => set('weeksInBase', e.target.value)}
              placeholder="0"
            />
          </label>
          <p className="final-checks-step__note">
            A textbook base typically runs 5 to 26 weeks — much shorter and there hasn't been
            enough time to shake out weak holders; much longer and the setup may be losing its
            edge.
          </p>
        </div>

        <div className="final-checks-step__divider" />

        <div className="final-checks-step__vcp-block">
          <span className="final-checks-step__vcp-label">Price</span>
          <p className="final-checks-step__vcp-question">
            How deep was the largest correction, and how narrow was the smallest pullback at the
            very right of the price base?
          </p>
          <div className="final-checks-step__grid">
            <label
              className={`final-checks-step__field final-checks-step__field--${largestCorrectionTone(vcpData.largestCorrectionPercent)}`}
            >
              <span className="final-checks-step__input-label">Largest correction (%)</span>
              <input
                type="number"
                min="0"
                step="1"
                className="final-checks-step__input"
                value={vcpData.largestCorrectionPercent}
                onChange={(e) => set('largestCorrectionPercent', e.target.value)}
                placeholder="0"
              />
            </label>
            <label
              className={`final-checks-step__field final-checks-step__field--${narrowestPullbackTone(vcpData.narrowestPullbackPercent)}`}
            >
              <span className="final-checks-step__input-label">Narrowest pullback (%)</span>
              <input
                type="number"
                min="0"
                step="1"
                className="final-checks-step__input"
                value={vcpData.narrowestPullbackPercent}
                onChange={(e) => set('narrowestPullbackPercent', e.target.value)}
                placeholder="0"
              />
            </label>
          </div>
          <p className="final-checks-step__note">
            Look for a largest correction in the 15–25% range and a final, right-most pullback
            under about 10% — the tighter that last contraction, the closer to a proper pivot.
          </p>
        </div>

        <div className="final-checks-step__divider" />

        <div className="final-checks-step__vcp-block">
          <span className="final-checks-step__vcp-label">Symmetry</span>
          <p className="final-checks-step__vcp-question">
            How many contractions (Ts) did the stock go through during the basing process?
          </p>
          <label
            className={`final-checks-step__field final-checks-step__field--${contractionCountTone(vcpData.contractionCount)}`}
          >
            <span className="final-checks-step__input-label">Number of contractions</span>
            <input
              type="number"
              min="0"
              step="1"
              className="final-checks-step__input"
              value={vcpData.contractionCount}
              onChange={(e) => set('contractionCount', e.target.value)}
              placeholder="0"
            />
          </label>
          <p className="final-checks-step__note">
            A healthy VCP typically shows 2 to 4 contractions, each tighter than the last. A
            single contraction hasn't really shown tightening yet, and 5 or more often means the
            base is getting choppy.
          </p>
        </div>
      </section>
    </div>
  )
}
