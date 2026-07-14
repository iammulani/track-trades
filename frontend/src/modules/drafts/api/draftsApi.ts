import { apiClient } from '../../../shared/api/client'
import type { DraftStepperState, NewTradeDraft, TradeDraft } from '../types/draft'

export async function fetchDrafts(): Promise<TradeDraft[]> {
  const { data } = await apiClient.get<TradeDraft[]>('/drafts')
  return data
}

/** The draft parked against a watchlist item, or null if that run was never started. */
export async function fetchDraftFor(watchlistId: string): Promise<TradeDraft | null> {
  const { data } = await apiClient.get<TradeDraft[]>('/drafts', { params: { watchlistId } })
  return data[0] ?? null
}

export async function createDraft(input: NewTradeDraft): Promise<TradeDraft> {
  const now = new Date().toISOString()
  const { data } = await apiClient.post<TradeDraft>('/drafts', {
    ...input,
    createdAt: now,
    updatedAt: now,
  })
  return data
}

export async function updateDraft(id: string, state: DraftStepperState): Promise<TradeDraft> {
  const { data } = await apiClient.patch<TradeDraft>(`/drafts/${id}`, {
    ...state,
    updatedAt: new Date().toISOString(),
  })
  return data
}

export async function removeDraft(id: string): Promise<void> {
  await apiClient.delete(`/drafts/${id}`)
}
