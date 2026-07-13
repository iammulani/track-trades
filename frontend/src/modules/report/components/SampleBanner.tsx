import { Icon } from '../../../shared/components/Icon'
import './SampleBanner.css'

interface SampleBannerProps {
  closedCount: number
}

/** Below this, performance figures are anecdotes wearing a decimal point. */
const MEANINGFUL_SAMPLE = 10

/** Says out loud what the sample can and can't support, so the page never flatters itself.
 * Process metrics (rules broken) are readable from trade one; expectancy and profit factor
 * are not. */
export function SampleBanner({ closedCount }: SampleBannerProps) {
  const thin = closedCount < MEANINGFUL_SAMPLE

  return (
    <div className={`sample-banner${thin ? ' is-thin' : ''}`}>
      <span className="sample-banner__chip">
        <Icon name="info" size={15} />
      </span>
      <p className="sample-banner__text">
        Based on <strong>{closedCount}</strong> closed trade{closedCount === 1 ? '' : 's'}.
        {thin && (
          <>
            {' '}
            The process figures below — rules broken, stops honoured, mistakes logged — are
            already worth reading. The performance figures (expectancy, profit factor, payoff
            ratio) are <strong>not yet statistically meaningful</strong> at this sample; treat
            them as a running tally, not a verdict on the system.
          </>
        )}
      </p>
    </div>
  )
}
