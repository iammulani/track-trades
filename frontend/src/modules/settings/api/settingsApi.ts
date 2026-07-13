import { apiClient } from '../../../shared/api/client'
import type { Settings, SettingsUpdate } from '../types/settings'

/** `/settings` is a singular resource (an object, not a collection) — no id in the path. */
export async function fetchSettings(): Promise<Settings> {
  const { data } = await apiClient.get<Settings>('/settings')
  return data
}

export async function updateSettings(input: SettingsUpdate): Promise<Settings> {
  const { data } = await apiClient.patch<Settings>('/settings', input)
  return data
}
