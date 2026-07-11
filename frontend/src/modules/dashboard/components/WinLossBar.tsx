import './WinLossBar.css'

interface WinLossBarProps {
  wins: number
  losses: number
  /** Rendered on the gradient hero card — use light-on-dark styling. */
  onHero?: boolean
}

/**
 * Win/loss proportion bar. Two segments separated by a 2px surface gap; each
 * segment carries a text label so identity never rests on colour alone.
 */
export function WinLossBar({ wins, losses, onHero = false }: WinLossBarProps) {
  const total = wins + losses
  const winPct = total === 0 ? 0 : (wins / total) * 100
  const lossPct = total === 0 ? 0 : (losses / total) * 100

  return (
    <div className={`winloss${onHero ? ' winloss--hero' : ''}`}>
      <div className="winloss__track" role="img" aria-label={`${wins} wins, ${losses} losses`}>
        {wins > 0 && (
          <div className="winloss__seg winloss__seg--win" style={{ width: `${winPct}%` }} />
        )}
        {losses > 0 && (
          <div className="winloss__seg winloss__seg--loss" style={{ width: `${lossPct}%` }} />
        )}
      </div>
      <div className="winloss__legend">
        <span className="winloss__key">
          <span className="winloss__dot winloss__dot--win" /> {wins} won
        </span>
        <span className="winloss__key">
          <span className="winloss__dot winloss__dot--loss" /> {losses} lost
        </span>
      </div>
    </div>
  )
}
