import type { IconName } from '../../../shared/components/Icon'
import type { Base, Stage } from '../types/placeTrade'

/** Visual/risk weight — `best` and `avoid` are the decisive ends of the scale,
 * `good`/`caution`/`bad` grade the middle. Drives color in `StageBaseStep`. */
export type RiskTone = 'best' | 'good' | 'caution' | 'bad' | 'avoid'

/** One themed group of notes in the hover-card panel — icon + heading tell you
 * what kind of note it is (duration, price action, volume, ...) at a glance. */
export interface DetailSection {
  icon: IconName
  heading: string
  points: string[]
}

export interface RiskOption<Id extends string = string> {
  id: Id
  label: string
  verdict: string
  tone: RiskTone
  /** Shown inline on the row, no hover needed. */
  summary: string
  /** Shown in the hover-card panel, grouped by theme. */
  detailSections: DetailSection[]
}

export const STAGE_OPTIONS: RiskOption<Stage>[] = [
  {
    id: 'stage-1',
    label: 'Stage 1',
    verdict: 'Should not trade',
    tone: 'avoid',
    summary: 'No buying stage 1',
    detailSections: [
      {
        icon: 'clock',
        heading: 'Duration',
        points: ['Stage 1 can last for an extended period for months to years.'],
      },
      {
        icon: 'waves',
        heading: 'Price action',
        points: [
          'During stage 1 the stock price will move in sideways fashion with a lack of any sustained price movement up or down',
          'The stock price will oscillate around its 200 day MA (40 week).',
          'During that oscillation, it lacks a real trend upward or downward. This dead in the water phase can last for months or even years.',
        ],
      },
      {
        icon: 'arrowDownRight',
        heading: 'Context',
        points: [
          'Often, this basing stage takes place after the stock price has declined during stage 4 for several months or more.',
        ],
      },
      {
        icon: 'bars',
        heading: 'Volume',
        points: [
          'Volume will generally contract and be relatively light compared with the previous volume during stage 4 decline.',
        ],
      },
    ],
  },
  {
    id: 'transition-1-2',
    label: 'Transitioning 1 → 2',
    verdict: 'Wait & watch',
    tone: 'caution',
    summary:
      'The stock price is above 150 day and 200 day MA. The 200 day MA has turned up. There are more up weeks on volume than down on volumes.',
    detailSections: [
      {
        icon: 'trending',
        heading: 'Transition criteria',
        points: [
          'A series of higher highs and higher lows has occurred.',
          'Large up weeks on volume spikes are contrasted by low volume on pullbacks.',
        ],
      },
    ],
  },
  {
    id: 'stage-2',
    label: 'Stage 2',
    verdict: 'Should trade',
    tone: 'best',
    summary:
      'A proper stage 2 will show significant volume. The share price may have doubled or even tripled at this point.',
    detailSections: [
      {
        icon: 'layers',
        heading: 'Moving averages',
        points: [
          'The stock price is above its 200 (40 week) day MA.',
          'The 200 day MA itself is in an uptrend. The 150 day (30 week) MA is above the 200 day (40 week) MA. Short term MAs are above long term MAs (e.g. 50 day MA is above the 150 day MA).',
        ],
      },
      {
        icon: 'trending',
        heading: 'Price action',
        points: [
          'The stock price is in a clear uptrend, defined by higher highs & higher lows in a staircase pattern.',
        ],
      },
      {
        icon: 'bars',
        heading: 'Volume',
        points: [
          'Volume spikes on big up days and big up weeks are contrasted by volume contractions during normal price pullbacks.',
          'A proper stage 2 will show significant volume as the stock is in strong demand on big up days & up weeks, and volume will be relatively light during pullbacks.',
        ],
      },
      {
        icon: 'arrowUpRight',
        heading: 'Magnitude',
        points: [
          'The share price may have doubled or even tripled at this point; however, this may be only the beginning.',
        ],
      },
    ],
  },
  {
    id: 'stage-3',
    label: 'Stage 3',
    verdict: 'Risky',
    tone: 'caution',
    summary: 'Topping process — the uptrend is losing momentum and starting to churn.',
    detailSections: [
      {
        icon: 'info',
        heading: 'Overview',
        points: [
          "Price action gets choppier: wider swings, failed breakouts, and a flattening moving average. The stock may still be near highs, but the character of the move has changed — it's distributing, not advancing. New entries here carry a much worse risk/reward.",
        ],
      },
      {
        icon: 'check',
        heading: 'What it looks like',
        points: [
          'Moving average flattening after a long advance',
          'Increased volatility without net progress',
          'Volume spikes on down days (distribution)',
        ],
      },
      {
        icon: 'alert',
        heading: 'Watch out for',
        points: [
          "Assuming 'it's just a pullback' when the trend has actually changed character",
          'Sizing up on a stock that is already extended',
        ],
      },
    ],
  },
  {
    id: 'stage-4',
    label: 'Stage 4',
    verdict: 'Too risky',
    tone: 'bad',
    summary: 'Confirmed downtrend — lower highs and lower lows below a falling moving average.',
    detailSections: [
      {
        icon: 'info',
        heading: 'Overview',
        points: [
          'The stock has broken down and is in a markdown phase. Price stays below a declining moving average, and every bounce is sold into. Buying here means fighting the dominant trend — the odds are stacked against you.',
        ],
      },
      {
        icon: 'check',
        heading: 'What it looks like',
        points: [
          'Price below a falling 30-week/150-day MA',
          'Lower highs and lower lows',
          'Bounces fail at declining resistance',
        ],
      },
      {
        icon: 'alert',
        heading: 'Watch out for',
        points: [
          "Bottom-fishing 'because it's cheap now'",
          'Confusing a dead-cat bounce for a real reversal',
        ],
      },
    ],
  },
]

export const BASE_OPTIONS: RiskOption<Base>[] = [
  {
    id: 'base-1',
    label: 'Base 1',
    verdict: 'Really good',
    tone: 'best',
    summary: 'Tight, well-formed base with shallow depth and a clean handle — textbook.',
    detailSections: [
      {
        icon: 'info',
        heading: 'Overview',
        points: [
          'The base is proportionally shallow relative to the prior advance, has enough time (typically 7+ weeks) to shake out weak holders, and shows volume drying up into the low. A handle, if present, is tight and forms in the upper half of the base — everything about the structure says accumulation, not distribution.',
        ],
      },
      {
        icon: 'check',
        heading: 'What it looks like',
        points: [
          'Depth roughly 15–25% off the high',
          '7+ weeks of consolidation',
          'Volume contracts as the base matures',
          'Tight handle in the upper half, if present',
        ],
      },
      {
        icon: 'alert',
        heading: 'Watch out for',
        points: ['A base that looks tight on a weekly chart but is still volatile day to day'],
      },
    ],
  },
  {
    id: 'base-2',
    label: 'Base 2',
    verdict: 'Good',
    tone: 'good',
    summary: 'Reasonable structure, a bit deeper or looser than ideal, but still tradeable.',
    detailSections: [
      {
        icon: 'info',
        heading: 'Overview',
        points: [
          "The base has the right shape but isn't textbook — maybe it's a little deeper than 25%, or the handle drifts toward the lower half. It still shows constructive volume characteristics overall, just with less margin for error than a Base 1.",
        ],
      },
      {
        icon: 'check',
        heading: 'What it looks like',
        points: [
          'Depth in the 25–35% range',
          'Volume mostly contracting, with some noise',
          'Handle present but not the tightest, driest form',
        ],
      },
      {
        icon: 'alert',
        heading: 'Watch out for',
        points: ['Deeper bases need a wider stop — make sure position size still fits your risk rule'],
      },
    ],
  },
  {
    id: 'base-3',
    label: 'Base 3',
    verdict: 'Risky',
    tone: 'caution',
    summary: 'Loose or unusually deep base — more chop than accumulation.',
    detailSections: [
      {
        icon: 'info',
        heading: 'Overview',
        points: [
          "Depth is excessive relative to the prior move, or the base has dragged on without tightening up. Volume isn't drying up the way you'd want, which suggests continued supply rather than quiet accumulation. Breakouts from bases like this fail more often.",
        ],
      },
      {
        icon: 'check',
        heading: 'What it looks like',
        points: [
          'Depth beyond roughly 35–40%',
          'No clear volume dry-up into the low',
          'Choppy, wide daily ranges throughout',
        ],
      },
      {
        icon: 'alert',
        heading: 'Watch out for',
        points: ["Treating a messy base as 'basing' just because it's been sideways a while"],
      },
    ],
  },
  {
    id: 'base-4',
    label: 'Base 4',
    verdict: 'Too risky',
    tone: 'avoid',
    summary: 'Deep, sloppy, or still-forming base with no sign of accumulation.',
    detailSections: [
      {
        icon: 'info',
        heading: 'Overview',
        points: [
          "Either the base is still too immature to judge, or it shows the hallmarks of distribution — heavy volume on down days, no tightening, repeated failed breakout attempts. There isn't enough evidence yet that this is a base worth buying out of.",
        ],
      },
      {
        icon: 'check',
        heading: 'What it looks like',
        points: [
          'Very deep pullback (40%+), or premature — not enough time in the base yet',
          'Heavy down-volume days scattered throughout',
          'Repeated failed breakout attempts',
        ],
      },
      {
        icon: 'alert',
        heading: 'Watch out for',
        points: ['FOMO-buying a failed breakout, hoping this attempt is different'],
      },
    ],
  },
]
