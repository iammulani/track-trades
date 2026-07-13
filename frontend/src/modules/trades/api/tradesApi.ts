import { apiClient } from '../../../shared/api/client'
import type { NewTrade, Trade } from '../types/trade'

export async function fetchTrades(): Promise<Trade[]> {
  const { data } = await apiClient.get<Trade[]>('/trades')
  return data
}

/** Places a new trade — always opens with no exit yet. */
export async function addTrade(input: NewTrade): Promise<Trade> {
  const { data } = await apiClient.post<Trade>('/trades', {
    symbol: input.symbol.toUpperCase(),
    side: input.side,
    quantity: input.quantity,
    entryPrice: input.entryPrice,
    exitPrice: null,
    entryTime: input.entryTime,
    exitTime: null,
    notes: input.notes ?? '',
    setup: input.setup ?? null,
  })
  return data
}
