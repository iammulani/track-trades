import { apiClient } from '../../../shared/api/client'
import type { CloseTradeInput, NewTrade, Trade } from '../types/trade'

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

/** Closes an open trade — writes the exit fill plus the exit learnings (reason + note pairs). */
export async function closeTrade(id: string, input: CloseTradeInput): Promise<Trade> {
  const { data } = await apiClient.patch<Trade>(`/trades/${id}`, {
    exitPrice: input.exitPrice,
    exitTime: input.exitTime,
    exitLearnings: input.exitLearnings.map((l) => ({ reason: l.reason, note: l.note.trim() })),
  })
  return data
}
