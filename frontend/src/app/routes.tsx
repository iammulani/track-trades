import { createBrowserRouter } from 'react-router-dom'
import { Layout } from '../shared/components/Layout'
import { DashboardPage } from '../modules/dashboard'
import { EquityPage } from '../modules/equity'
import { WatchlistPage } from '../modules/watchlist'
import { PlaceTradePage } from '../modules/place-trade'
import { Home } from '../modules/home'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'equity', element: <EquityPage /> },
      { path: 'watchlist', element: <WatchlistPage /> },
      { path: 'watchlist/:id/place-trade', element: <PlaceTradePage /> },
      { path: 'about', element: <Home /> },
    ],
  },
])
