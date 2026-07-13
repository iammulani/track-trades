import type { CurrencyConfig } from '../../../shared/utils/currency'

/** The `/settings` resource — a single object in `backend/data/settings.json`, not a
 * collection (json-server serves a non-array file as a singular resource, so it's
 * `GET`/`PATCH /settings` with no id). */
export interface Settings extends CurrencyConfig {}

/** A partial update — only the keys being changed are sent. */
export type SettingsUpdate = Partial<Settings>
