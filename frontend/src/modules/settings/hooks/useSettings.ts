import { useCallback, useEffect, useState } from 'react'
import { setCurrencyConfig } from '../../../shared/utils/currency'
import { fetchSettings, updateSettings } from '../api/settingsApi'
import type { Settings, SettingsUpdate } from '../types/settings'

interface SettingsState {
  settings: Settings | null
  loading: boolean
  error: string | null
  saving: boolean
  save: (input: SettingsUpdate) => Promise<void>
}

/**
 * Loads `/settings` and publishes the currency into the shared store, so every
 * `formatCurrency` call across the app picks it up (see `shared/utils/currency.ts`).
 *
 * Used twice: the app shell calls it once at boot to apply the saved currency before
 * anything renders an amount, and the Settings page calls it for the form itself. If the
 * fetch fails the app still runs — formatting just falls back to `DEFAULT_CURRENCY`.
 */
export function useSettings(): SettingsState {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const apply = useCallback((next: Settings) => {
    setSettings(next)
    setCurrencyConfig({ currency: next.currency, locale: next.locale })
  }, [])

  useEffect(() => {
    let cancelled = false
    fetchSettings()
      .then((next) => {
        if (cancelled) return
        apply(next)
        setError(null)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Failed to load settings')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [apply])

  const save = useCallback(
    async (input: SettingsUpdate) => {
      setSaving(true)
      try {
        apply(await updateSettings(input))
        setError(null)
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to save settings')
      } finally {
        setSaving(false)
      }
    },
    [apply],
  )

  return { settings, loading, error, saving, save }
}
