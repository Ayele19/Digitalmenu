import React, { useEffect } from 'react'
import '../../styles/ConfirmDialog.css'

/**
 * ConfirmDialog
 *
 * Props:
 *   isOpen    - boolean
 *   title     - string
 *   message   - string
 *   onConfirm - () => void
 *   onCancel  - () => void
 */
export default function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel }) {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return
    function handleKey(e) {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, onCancel])

  if (!isOpen) return null

  return (
    <div
      className="confirm-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      aria-describedby="confirm-message"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div className="confirm-card">
        <h2 className="confirm-title" id="confirm-title">{title}</h2>
        <p className="confirm-message" id="confirm-message">{message}</p>
        <div className="confirm-actions">
          <button className="confirm-btn-cancel" onClick={onCancel} type="button">
            Cancel
          </button>
          <button className="confirm-btn-confirm" onClick={onConfirm} type="button">
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}
