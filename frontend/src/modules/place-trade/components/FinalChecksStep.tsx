import { HoverCard } from '../../../shared/components/HoverCard'
import { Icon } from '../../../shared/components/Icon'
import type { ChecklistChecked } from '../types/placeTrade'
import {
  BREAKOUT_CONFIRMATION_CHECKLIST_ITEMS,
  OVERHEAD_SUPPLY_CHECKLIST_ITEMS,
} from '../utils/finalChecksItems'
import { ChecklistStep } from './ChecklistStep'
import './FinalChecksStep.css'

interface FinalChecksStepProps {
  checked: ChecklistChecked
  onToggle: (id: string) => void
}

export function FinalChecksStep({ checked, onToggle }: FinalChecksStepProps) {
  return (
    <div className="final-checks-step">
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
                    That tightening is simply supply and demand at work — the stock changing hands
                    in an orderly way.
                  </li>
                </ul>
              </div>

              <div className="final-checks-details__section">
                <span className="final-checks-details__section-title">
                  <Icon name="clock" size={12} /> Be patient
                </span>
                <ul>
                  <li>
                    Wait for the stock to go through its normal process of shares moving from weak
                    holders to strong ones.
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
                    Evidence supply has dried up: trading volume contracts significantly and price
                    action quiets down noticeably.
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
      <ChecklistStep items={OVERHEAD_SUPPLY_CHECKLIST_ITEMS} checked={checked} onToggle={onToggle} />

      <div className="final-checks-step__divider" />

      <div className="final-checks-step__section-header">
        <div className="final-checks-step__heading-row">
          <h3>Breakout Confirmation</h3>
          <HoverCard
            label="More about breakout confirmation"
            trigger={<Icon name="info" size={12} />}
          >
            <div className="final-checks-details">
              <div className="final-checks-details__heading">Breakout Confirmation</div>

              <div className="final-checks-details__section">
                <span className="final-checks-details__section-title">
                  <Icon name="check" size={12} /> What to confirm
                </span>
                <ul>
                  <li>The overall market trend should be bullish.</li>
                  <li>The stock's industry group should also be acting positively.</li>
                  <li>
                    Volume must confirm the breakout — look for a noticeable increase over
                    average.
                  </li>
                </ul>
              </div>

              <div className="final-checks-details__section">
                <span className="final-checks-details__section-title">
                  <Icon name="alert" size={12} /> Warning sign
                </span>
                <ul>
                  <li>
                    Never overlook poor volume on a breakout — it's a very important danger signal
                    that the breakout lacks staying power.
                  </li>
                </ul>
              </div>

              <div className="final-checks-details__section">
                <span className="final-checks-details__section-title">
                  <Icon name="arrowUpRight" size={12} /> Overhead resistance
                </span>
                <ul>
                  <li>
                    The stock should have minimum resistance overhead — no big supply zone sitting
                    on top that could cap the advance before it even gets going.
                  </li>
                </ul>
              </div>
            </div>
          </HoverCard>
        </div>
        <p>Confirm the market, group, and volume are lining up behind this breakout.</p>
      </div>
      <ChecklistStep
        items={BREAKOUT_CONFIRMATION_CHECKLIST_ITEMS}
        checked={checked}
        onToggle={onToggle}
      />
    </div>
  )
}
