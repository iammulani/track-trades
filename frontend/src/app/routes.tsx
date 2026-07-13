import { createBrowserRouter } from 'react-router-dom'
import { Layout } from '../shared/components/Layout'
import { DashboardPage } from '../modules/dashboard'
import { EquityPage } from '../modules/equity'
import { ReportPage } from '../modules/report'
import { SettingsPage } from '../modules/settings'
import { WatchlistPage } from '../modules/watchlist'
import { PlaceTradePage } from '../modules/place-trade'
import { TradeDetailPage } from '../modules/trade-detail'
import { Home } from '../modules/home'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'report', element: <ReportPage /> },
      { path: 'equity', element: <EquityPage /> },
      { path: 'watchlist', element: <WatchlistPage /> },
      { path: 'watchlist/:id/place-trade', element: <PlaceTradePage /> },
      { path: 'trades/:id', element: <TradeDetailPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: 'about', element: <Home /> },
    ],
  },
])
