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

/** These 3 are non-negotiable — a breakout without the market, group, and volume behind it
 * is a hopeful guess, not a confirmed move — so they're gated in `tradeRating.ts` rather
 * than merely scored. `minimal-overhead-resistance` stays a soft check alongside Overhead
 * Supply. */
export const GATED_BREAKOUT_IDS = ['market-bullish', 'group-positive', 'volume-confirms-breakout']

/** Most checklist rows just read checked/unchecked, but the 3 gated breakout-confirmation
 * checks are non-negotiable — a checkbox only has two states, so "not checked" (whether
 * never touched or explicitly toggled off) is a red flag, not a shrug, and gets its own
 * danger styling instead of the plain muted strikethrough. Only ever rendered on the Review
 * step and the read-only Trade Detail page — both strictly after Final Checks — so there's
 * no "haven't gotten there yet" case to protect against here. Shared by the two so they
 * can't drift. */
export function checklistItemClass(id: string, checked: Record<string, boolean>): string {
  const value = checked[id]
  const isGated = GATED_BREAKOUT_IDS.includes(id)
  return [
    value ? 'is-checked' : 'is-unchecked',
    isGated ? 'is-gated' : '',
    isGated && !value ? 'is-danger' : '',
  ]
    .filter(Boolean)
    .join(' ')
}
