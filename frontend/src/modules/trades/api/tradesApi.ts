import { apiClient } from '../../../shared/api/client'
import type { Trade } from '../types/trade'

export async function fetchTrades(): Promise<Trade[]> {
  const { data } = await apiClient.get<Trade[]>('/trades')
  return data
}
