import { NavLink, Outlet } from 'react-router-dom'
import { Icon, type IconName } from './Icon'
import './Layout.css'

interface NavItem {
  to: string
  label: string
  icon: IconName
  end?: boolean
}

const NAV: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: 'dashboard', end: true },
  { to: '/equity', label: 'Equity Curve', icon: 'trending' },
  { to: '/about', label: 'About', icon: 'about' },
]

export function Layout() {
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sidebar__brand">
          <span className="sidebar__logo">
            <Icon name="logo" size={18} />
          </span>
          <span className="sidebar__name">Track Trades</span>
        </div>

        <nav className="sidebar__nav">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `sidebar__link${isActive ? ' is-active' : ''}`}
            >
              <Icon name={item.icon} size={18} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar__footer">Local-first · your data stays on your machine</div>
      </aside>

      <main className="content">
        <Outlet />
      </main>
    </div>
  )
}
