import { createBrowserRouter } from 'react-router-dom'
import { Layout } from '../shared/components/Layout'
import { Home } from '../modules/home/Home'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [{ index: true, element: <Home /> }],
  },
])
