import { apiClient } from '../../../shared/api/client'
import type { FundamentalsRecord, NewFundamentalsRecord, QuarterFinancials } from '../types/fundamentals'

export async function fetchFundamentals(): Promise<FundamentalsRecord[]> {
  const { data } = await apiClient.get<FundamentalsRecord[]>('/fundamentals')
  return data
}

/** The fundamentals record for a watchlist item, or null if none has been started. */
export async function fetchFundamentalsFor(watchlistItemId: string): Promise<FundamentalsRecord | null> {
  const { data } = await apiClient.get<FundamentalsRecord[]>('/fundamentals', {
    params: { watchlistItemId },
  })
  return data[0] ?? null
}

export async function createFundamentals(input: NewFundamentalsRecord): Promise<FundamentalsRecord> {
  const { data } = await apiClient.post<FundamentalsRecord>('/fundamentals', {
    ...input,
    updatedAt: new Date().toISOString(),
  })
  return data
}

export async function updateFundamentals(
  id: string,
  input: { asOfPeriod: string; quarterCount: number; quarters: QuarterFinancials[] },
): Promise<FundamentalsRecord> {
  const { data } = await apiClient.patch<FundamentalsRecord>(`/fundamentals/${id}`, {
    ...input,
    updatedAt: new Date().toISOString(),
  })
  return data
}

export async function removeFundamentals(id: string): Promise<void> {
  await apiClient.delete(`/fundamentals/${id}`)
}
