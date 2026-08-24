import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

/**
 * Frosted dialog for the board.
 *
 * Portalled into the `.brd` root rather than into <body>: a column sets
 * `backdrop-filter`, which makes it a containing block for fixed
 * descendants, so a dialog rendered in place would anchor itself to the
 * column instead of the viewport. Mounting at the board root escapes
 * that while still inheriting the board's tokens and font.
 */
export default function GlassModal({ title, badge, onClose, children, footer }) {
  const [host, setHost] = useState(null)

  useEffect(() => {
    setHost(document.querySelector('.brd') || document.body)
  }, [])

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!host) return null

  return createPortal(
    <div
      className="brd-overlay"
      onMouseDown={e => { if (e.target === e.currentTarget) onClose?.() }}
      role="presentation"
    >
      <div className="brd-modal" role="dialog" aria-modal="true" aria-label={title}>
        <header className="brd-modal-head">
          <div>
            {badge}
            <h2 className="brd-modal-title">{title}</h2>
          </div>
          <button className="brd-modal-x" onClick={onClose} aria-label="Close dialog">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2.2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </header>

        <div className="brd-modal-body">{children}</div>

        <footer className="brd-modal-foot">{footer}</footer>
      </div>
    </div>,
    host
  )
}
