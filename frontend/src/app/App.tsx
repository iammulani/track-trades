import { RouterProvider } from 'react-router-dom'
import { useSettings } from '../modules/settings'
import { useCurrencyConfig } from '../shared/hooks/useCurrencyConfig'
import { router } from './routes'

export function App() {
  /** Loads `/settings` once and publishes the saved currency into the shared store before
   * anything below renders an amount — otherwise the first paint would show the default
   * currency and then visibly flip to the saved one. */
  const { loading } = useSettings()
  const { currency } = useCurrencyConfig()

  if (loading) return null

  /** `formatCurrency` reads the currency from a module-level store rather than from props,
   * so React has no way to know a change to it affects the tree. Keying the router on the
   * currency remounts everything — heavy-handed, but right for something that changes once
   * in a blue moon and touches every rendered amount when it does. */
  return <RouterProvider router={router} key={currency} />
}
