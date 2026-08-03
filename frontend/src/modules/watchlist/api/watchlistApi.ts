import { apiClient } from '../../../shared/api/client'
import type {
  NewWatchlistItem,
  WatchCategory,
  WatchlistItem,
  WatchNote,
  WatchRating,
} from '../types/watchlistItem'
import { makeNote } from '../utils/notes'

export async function fetchWatchlist(): Promise<WatchlistItem[]> {
  const { data } = await apiClient.get<WatchlistItem[]>('/watchlist')
  return data
}

export async function addWatchlistItem(input: NewWatchlistItem): Promise<WatchlistItem> {
  const watchedSince = input.watchedSince ?? new Date().toISOString()
  const opening = input.notes?.trim()
  const { data } = await apiClient.post<WatchlistItem>('/watchlist', {
    symbol: input.symbol.toUpperCase(),
    category: input.category,
    side: input.side,
    // The opening note is dated the day watching started, not "now" — a backdated
    // ticker's first thought belongs on the day it was actually had.
    notes: opening ? [makeNote(opening, watchedSince)] : [],
    link: input.link?.trim() || '',
    watchedSince,
  })
  return data
}

export async function removeWatchlistItem(id: string): Promise<void> {
  await apiClient.delete(`/watchlist/${id}`)
}

export async function updateWatchlistCategory(
  id: string,
  category: WatchCategory,
): Promise<WatchlistItem> {
  const { data } = await apiClient.patch<WatchlistItem>(`/watchlist/${id}`, { category })
  return data
}

export async function updateWatchlistRating(
  id: string,
  rating: WatchRating,
): Promise<WatchlistItem> {
  const { data } = await apiClient.patch<WatchlistItem>(`/watchlist/${id}`, { rating })
  return data
}

/** Adding, editing and deleting a note all go through here — the caller computes the
 * next list and PATCHes the whole thing. */
export async function updateWatchlistNotes(
  id: string,
  notes: WatchNote[],
): Promise<WatchlistItem> {
  const { data } = await apiClient.patch<WatchlistItem>(`/watchlist/${id}`, { notes })
  return data
}
