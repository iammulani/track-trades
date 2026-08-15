import { apiClient } from '../../../shared/api/client'
import type { ExitedWatchlistItem, NewExitedWatchlistItem } from '../types/exitedWatchlistItem'

export async function fetchExitedWatchlist(): Promise<ExitedWatchlistItem[]> {
  const { data } = await apiClient.get<ExitedWatchlistItem[]>('/exited-watchlist')
  return data
}

export async function addExitedWatchlistItem(
  input: NewExitedWatchlistItem,
): Promise<ExitedWatchlistItem> {
  const { data } = await apiClient.post<ExitedWatchlistItem>('/exited-watchlist', input)
  return data
}

export async function removeExitedWatchlistItem(id: string): Promise<void> {
  await apiClient.delete(`/exited-watchlist/${id}`)
}
