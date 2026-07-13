import { apiClient } from '../../../shared/api/client'
import type { NewWatchlistItem, WatchCategory, WatchlistItem } from '../types/watchlistItem'

export async function fetchWatchlist(): Promise<WatchlistItem[]> {
  const { data } = await apiClient.get<WatchlistItem[]>('/watchlist')
  return data
}

export async function addWatchlistItem(input: NewWatchlistItem): Promise<WatchlistItem> {
  const { data } = await apiClient.post<WatchlistItem>('/watchlist', {
    symbol: input.symbol.toUpperCase(),
    category: input.category,
    side: input.side,
    notes: input.notes?.trim() || '',
    link: input.link?.trim() || '',
    watchedSince: input.watchedSince ?? new Date().toISOString(),
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
