import { useEffect } from 'react'
import type { ReactNode } from 'react'
import './Modal.css'

interface ModalProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  width?: number
  labelledBy?: string
}

/** Backdrop + card shell shared by every popup (add forms, confirmations, …). */
export function Modal({ open, onClose, children, width = 400, labelledBy }: ModalProps) {
  useEffect(() => {
    if (!open) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="modal__backdrop" onClick={onClose}>
      <div
        className="modal"
        style={{ width }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}
