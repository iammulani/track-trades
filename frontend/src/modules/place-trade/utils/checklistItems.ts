export interface ChecklistItem {
  id: string
  label: string
}

/**
 * MOCK pre-trade checklist — placeholder questions to validate the flow.
 * Replace this list with the real checklist; nothing else needs to change,
 * ChecklistStep renders whatever is here.
 */
export const CHECKLIST_ITEMS: ChecklistItem[] = [
  { id: 'volume', label: 'Volume/momentum confirms the move' },
  { id: 'news', label: 'No major news or earnings before my exit horizon' },
  { id: 'trend', label: 'Overall market/sector trend supports this direction' },
  {
    id: 'stop-logic',
    label: 'My stop is placed where the thesis is invalidated, not an arbitrary %',
  },
  { id: 'size', label: 'This position size fits my risk-per-trade rule' },
  { id: 'ok-with-loss', label: "I'm fine taking this loss if my stop is hit" },
]
