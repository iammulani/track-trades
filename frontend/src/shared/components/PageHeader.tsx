import type { ReactNode } from 'react'
import { Icon, type IconName } from './Icon'
import './PageHeader.css'

interface PageHeaderProps {
  icon: IconName
  title: string
  subtitle?: string
  actions?: ReactNode
}

/** The icon-chip + title + subtitle every page leads with. */
export function PageHeader({ icon, title, subtitle, actions }: PageHeaderProps) {
  return (
    <header className="page-header">
      <div className="page-header__main">
        <span className="page-header__icon">
          <Icon name={icon} size={22} />
        </span>
        <div>
          <h1 className="page-header__title">{title}</h1>
          {subtitle && <p className="page-header__subtitle">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="page-header__actions">{actions}</div>}
    </header>
  )
}
