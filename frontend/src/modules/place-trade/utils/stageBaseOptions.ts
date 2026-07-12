import type { Base, Stage } from '../types/placeTrade'

/** Visual/risk weight — `best` and `avoid` are the decisive ends of the scale,
 * `good`/`caution`/`bad` grade the middle. Drives color in `StageBaseStep`. */
export type RiskTone = 'best' | 'good' | 'caution' | 'bad' | 'avoid'

export interface RiskOptionDetails {
  description: string
  lookFor: string[]
  watchOut: string[]
}

export interface RiskOption<Id extends string = string> {
  id: Id
  label: string
  verdict: string
  tone: RiskTone
  summary: string
  details: RiskOptionDetails
}

export const STAGE_OPTIONS: RiskOption<Stage>[] = [
  {
    id: 'stage-1',
    label: 'Stage 1',
    verdict: 'Should not trade',
    tone: 'avoid',
    summary: 'Flat, directionless price action after a decline — the stock is basing, not moving.',
    details: {
      description:
        "Price is chopping sideways in a tight range, well below any meaningful moving-average slope, often after a Stage 4 decline. Volume is unremarkable and there's no clear catalyst. Buying here means guessing when the base will resolve — there's no edge yet.",
      lookFor: [
        'Flat 30-week (or 150/200-day) moving average',
        'Price chopping sideways in a defined range',
        'Volume drying up — no institutional interest yet',
        'No clear catalyst on the horizon',
      ],
      watchOut: [
        "Buying a 'cheap' stock only to watch it keep basing for months",
        'Mistaking a Stage 1 bounce for a real breakout',
      ],
    },
  },
  {
    id: 'transition-1-2',
    label: 'Transitioning 1 → 2',
    verdict: 'Really good trade',
    tone: 'best',
    summary: 'The breakout moment — price clears the base on rising volume as the trend turns up.',
    details: {
      description:
        "This is the highest-probability entry in the whole cycle: price breaks out of the Stage 1 base above resistance, the moving average starts curling up, and volume expands meaningfully versus the base. You're buying the first leg of a new uptrend, not chasing an extended move.",
      lookFor: [
        'Breakout above Stage 1 resistance on 1.5x+ average volume',
        '30-week/150-day MA flattening and starting to turn up',
        'A higher low forming just under the breakout point',
        'Relative strength vs. the market turning positive',
      ],
      watchOut: [
        'False breakouts that fail to hold above resistance',
        "Chasing too far past the breakout — if you're late, wait for the next pullback",
      ],
    },
  },
  {
    id: 'stage-2',
    label: 'Stage 2',
    verdict: 'Good trade',
    tone: 'good',
    summary: 'Established uptrend — higher highs and higher lows above a rising moving average.',
    details: {
      description:
        "The stock is in a confirmed markup phase. Price stays above a rising moving average, pulls back to support and holds, then continues higher. This is the 'buy the dip in an uptrend' phase — still favorable, just not as fresh as the breakout itself.",
      lookFor: [
        'Price consistently above a rising 30-week/150-day MA',
        'Pullbacks are shallow and bought quickly',
        'Volume expands on up days, contracts on down days',
      ],
      watchOut: [
        'Buying right into resistance on an extended run with no pullback',
        'Ignoring signs the advance is decelerating (narrowing ranges, fading volume)',
      ],
    },
  },
  {
    id: 'stage-3',
    label: 'Stage 3',
    verdict: 'Risky',
    tone: 'caution',
    summary: "Topping process — the uptrend is losing momentum and starting to churn.",
    details: {
      description:
        "Price action gets choppier: wider swings, failed breakouts, and a flattening moving average. The stock may still be near highs, but the character of the move has changed — it's distributing, not advancing. New entries here carry a much worse risk/reward.",
      lookFor: [
        'Moving average flattening after a long advance',
        'Increased volatility without net progress',
        'Volume spikes on down days (distribution)',
      ],
      watchOut: [
        "Assuming 'it's just a pullback' when the trend has actually changed character",
        'Sizing up on a stock that is already extended',
      ],
    },
  },
  {
    id: 'stage-4',
    label: 'Stage 4',
    verdict: 'Too risky',
    tone: 'bad',
    summary: 'Confirmed downtrend — lower highs and lower lows below a falling moving average.',
    details: {
      description:
        "The stock has broken down and is in a markdown phase. Price stays below a declining moving average, and every bounce is sold into. Buying here means fighting the dominant trend — the odds are stacked against you.",
      lookFor: [
        'Price below a falling 30-week/150-day MA',
        'Lower highs and lower lows',
        'Bounces fail at declining resistance',
      ],
      watchOut: [
        "Bottom-fishing 'because it's cheap now'",
        'Confusing a dead-cat bounce for a real reversal',
      ],
    },
  },
]

export const BASE_OPTIONS: RiskOption<Base>[] = [
  {
    id: 'base-1',
    label: 'Base 1',
    verdict: 'Really good',
    tone: 'best',
    summary: 'Tight, well-formed base with shallow depth and a clean handle — textbook.',
    details: {
      description:
        "The base is proportionally shallow relative to the prior advance, has enough time (typically 7+ weeks) to shake out weak holders, and shows volume drying up into the low. A handle, if present, is tight and forms in the upper half of the base — everything about the structure says accumulation, not distribution.",
      lookFor: [
        'Depth roughly 15–25% off the high',
        '7+ weeks of consolidation',
        'Volume contracts as the base matures',
        'Tight handle in the upper half, if present',
      ],
      watchOut: ['A base that looks tight on a weekly chart but is still volatile day to day'],
    },
  },
  {
    id: 'base-2',
    label: 'Base 2',
    verdict: 'Good',
    tone: 'good',
    summary: 'Reasonable structure, a bit deeper or looser than ideal, but still tradeable.',
    details: {
      description:
        "The base has the right shape but isn't textbook — maybe it's a little deeper than 25%, or the handle drifts toward the lower half. It still shows constructive volume characteristics overall, just with less margin for error than a Base 1.",
      lookFor: [
        'Depth in the 25–35% range',
        'Volume mostly contracting, with some noise',
        'Handle present but not the tightest, driest form',
      ],
      watchOut: ['Deeper bases need a wider stop — make sure position size still fits your risk rule'],
    },
  },
  {
    id: 'base-3',
    label: 'Base 3',
    verdict: 'Risky',
    tone: 'caution',
    summary: 'Loose or unusually deep base — more chop than accumulation.',
    details: {
      description:
        "Depth is excessive relative to the prior move, or the base has dragged on without tightening up. Volume isn't drying up the way you'd want, which suggests continued supply rather than quiet accumulation. Breakouts from bases like this fail more often.",
      lookFor: [
        'Depth beyond roughly 35–40%',
        'No clear volume dry-up into the low',
        'Choppy, wide daily ranges throughout',
      ],
      watchOut: ["Treating a messy base as 'basing' just because it's been sideways a while"],
    },
  },
  {
    id: 'base-4',
    label: 'Base 4',
    verdict: 'Too risky',
    tone: 'avoid',
    summary: 'Deep, sloppy, or still-forming base with no sign of accumulation.',
    details: {
      description:
        "Either the base is still too immature to judge, or it shows the hallmarks of distribution — heavy volume on down days, no tightening, repeated failed breakout attempts. There isn't enough evidence yet that this is a base worth buying out of.",
      lookFor: [
        'Very deep pullback (40%+), or premature — not enough time in the base yet',
        'Heavy down-volume days scattered throughout',
        'Repeated failed breakout attempts',
      ],
      watchOut: ["FOMO-buying a failed breakout, hoping this attempt is different"],
    },
  },
]
