import { Card } from '../../shared/components/Card'
import { PageHeader } from '../../shared/components/PageHeader'
import { CurrencyField } from './components/CurrencyField'
import { useSettings } from './hooks/useSettings'
import { findCurrencyOption } from './utils/currencyOptions'
import './SettingsPage.css'

export function SettingsPage() {
  const { settings, loading, error, saving, save } = useSettings()

  /** The picker offers currency codes; the locale that formats each one correctly rides
   * along with it (see `currencyOptions.ts`), so both are saved together. */
  function onCurrencyChange(currency: string) {
    const option = findCurrencyOption(currency)
    if (!option) return
    void save({ currency: option.currency, locale: option.locale })
  }

  return (
    <section className="settings">
      <PageHeader
        icon="settings"
        title="Settings"
        subtitle="Preferences for this journal. Saved to backend/data/settings.json."
      />

      {loading && <p className="settings__state">Loading settings…</p>}

      {error && (
        <p className="settings__state settings__state--error">
          Couldn’t load settings: {error}. Is the backend running on port 4000?
        </p>
      )}

      {!loading && settings && (
        <Card className="settings__card">
          <CurrencyField
            value={settings.currency}
            disabled={saving}
            onChange={onCurrencyChange}
          />
          {saving && <p className="settings__saving">Saving…</p>}
        </Card>
      )}
    </section>
  )
}
