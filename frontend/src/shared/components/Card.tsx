import type { ReactNode } from 'react'
import './Card.css'

interface CardProps {
  children: ReactNode
  className?: string
}

/** Surface container used across modules. */
export function Card({ children, className }: CardProps) {
  return <div className={`card${className ? ` ${className}` : ''}`}>{children}</div>
}
