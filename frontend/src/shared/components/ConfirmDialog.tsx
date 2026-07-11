import type { ReactNode } from 'react'
import { Modal } from './Modal'
import './ConfirmDialog.css'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

/** A small modal for confirming a destructive action before it happens. */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Remove',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onCancel} width={380} labelledBy="confirm-dialog-title">
      <h3 id="confirm-dialog-title" className="confirm-dialog__title">
        {title}
      </h3>
      <div className="confirm-dialog__message">{message}</div>
      <div className="confirm-dialog__actions">
        <button type="button" className="confirm-dialog__cancel" onClick={onCancel}>
          {cancelLabel}
        </button>
        <button type="button" className="confirm-dialog__confirm" onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
