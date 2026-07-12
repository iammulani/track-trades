import type { ChecklistItem } from './checklistItems'

/** Checks for the "Overhead Supply" section of the Final Checks step. */
export const OVERHEAD_SUPPLY_CHECKLIST_ITEMS: ChecklistItem[] = [
  {
    id: 'contractions-tightening',
    label: 'Contractions are getting tighter from left to right (a proper VCP)',
  },
  {
    id: 'volume-price-quiet',
    label: 'Volume and price action have quieted down noticeably on the right side of the base',
  },
  {
    id: 'weak-holders-shaken-out',
    label: "Enough time has passed for weak holders to be shaken out — this isn't a crowded trade",
  },
]
