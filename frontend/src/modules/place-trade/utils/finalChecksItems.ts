import type { ChecklistItem } from './checklistItems'

/** Checks for the "Overhead Supply" section of the Final Checks step. */
export const OVERHEAD_SUPPLY_CHECKLIST_ITEMS: ChecklistItem[] = [
  {
    id: 'volume-price-quiet',
    label: 'Volume and price action have quieted down noticeably on the right side of the base',
  },
  {
    id: 'weak-holders-shaken-out',
    label: "Enough time has passed for weak holders to be shaken out — this isn't a crowded trade",
  },
]

/** Checks for the "Breakout Confirmation" section of the Final Checks step. */
export const BREAKOUT_CONFIRMATION_CHECKLIST_ITEMS: ChecklistItem[] = [
  { id: 'market-bullish', label: 'The overall market trend is bullish' },
  { id: 'group-positive', label: "The stock's industry group is acting positively" },
  {
    id: 'volume-confirms-breakout',
    label: 'Volume confirms the breakout — noticeably higher than average',
  },
  {
    id: 'minimal-overhead-resistance',
    label: 'There is minimal resistance overhead that could cap the move',
  },
]
