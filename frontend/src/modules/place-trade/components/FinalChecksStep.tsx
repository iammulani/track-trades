import { HoverCard } from '../../../shared/components/HoverCard'
import { Icon } from '../../../shared/components/Icon'
import type { ChecklistChecked, VcpStructureData } from '../types/placeTrade'
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
          <h3>VCP Structure</h3>
          <p>Capture the shape of the base — time, price, and symmetry.</p>
        </div>

        <div className="final-checks-step__vcp-block">
          <span className="final-checks-step__vcp-label">Time</span>
          <p className="final-checks-step__vcp-question">
            How many weeks have passed since the base started?
          </p>
          <label className="final-checks-step__field">
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
        </div>

        <div className="final-checks-step__divider" />

        <div className="final-checks-step__vcp-block">
          <span className="final-checks-step__vcp-label">Price</span>
          <p className="final-checks-step__vcp-question">
            How deep was the largest correction, and how narrow was the smallest pullback at the
            very right of the price base?
          </p>
          <div className="final-checks-step__grid">
            <label className="final-checks-step__field">
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
            <label className="final-checks-step__field">
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
        </div>

        <div className="final-checks-step__divider" />

        <div className="final-checks-step__vcp-block">
          <span className="final-checks-step__vcp-label">Symmetry</span>
          <p className="final-checks-step__vcp-question">
            How many contractions (Ts) did the stock go through during the basing process?
          </p>
          <label className="final-checks-step__field">
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
        </div>
      </section>
    </div>
  )
}
