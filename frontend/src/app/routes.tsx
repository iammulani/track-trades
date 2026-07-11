import { createBrowserRouter } from 'react-router-dom'
import { Layout } from '../shared/components/Layout'
import { DashboardPage } from '../modules/dashboard'
import { Home } from '../modules/home'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'about', element: <Home /> },
    ],
  },
])
