import type { WatchNote, WatchlistItem } from '../types/watchlistItem'

/** Newest entry first — the current state of the setup is what you want to read first. */
export function sortNotesByDate(notes: WatchNote[]): WatchNote[] {
  return [...notes].sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
}

/** The one place "absent means no notes" is decided — including the legacy single-string
 * shape, which reads back as one entry dated the day the symbol went on the list. */
export function itemNotes(item: Pick<WatchlistItem, 'notes' | 'watchedSince'>): WatchNote[] {
  const raw = item.notes
  if (Array.isArray(raw)) return sortNotesByDate(raw)
  if (typeof raw === 'string' && raw.trim()) {
    return [{ id: 'legacy', text: raw.trim(), date: item.watchedSince }]
  }
  return []
}

export function noteCount(item: Pick<WatchlistItem, 'notes' | 'watchedSince'>): number {
  return itemNotes(item).length
}

/** Builds an entry. `date` is an ISO timestamp — callers holding a `yyyy-mm-dd` input value
 * convert it with `dateValueToIso()` first. An empty conclusion is left off entirely
 * rather than stored as `''`, so "has a conclusion" is a plain truthiness check. */
export function makeNote(text: string, date: string, conclusion?: string): WatchNote {
  const note: WatchNote = { id: crypto.randomUUID(), text: text.trim(), date }
  if (conclusion?.trim()) note.conclusion = conclusion.trim()
  return note
}
