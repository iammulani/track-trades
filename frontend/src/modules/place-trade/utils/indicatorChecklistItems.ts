import type { ChecklistItem } from './checklistItems'

/** Trend-confirmation checks shown in the "Indicators" step, above the RS Rating/52-week data capture. */
export const INDICATOR_CHECKLIST_ITEMS: ChecklistItem[] = [
  {
    id: 'ma-uptrend',
    label: '50, 150 & 200 day (10, 30, 40 week) MAs are in an uptrend',
  },
  {
    id: 'ma-stacked',
    label:
      '50 day MA is above the 150 day MA, and the 150 day MA is above the 200 day MA — true on both daily and weekly charts',
  },
  {
    id: 'ma200-duration',
    label: 'The 200 day MA is trending up for at least 1 month (preferably 4-5 months)',
  },
]
