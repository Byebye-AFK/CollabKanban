import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { CloseIcon } from '../shell/icons'

/**
 * The one dialog every page uses.
 *
 * Portalled into <body> so no ancestor can become its containing block,
 * and closed by Escape, the × button or a press on the backdrop. Pass
 * `as="form"` with `onSubmit` when the dialog is a form, so Enter in a
 * field submits it natively.
 */
export default function Modal({
  title,
  label = title,
  kicker,
  onClose,
  footer,
  children,
  as: Tag = 'div',
  onSubmit,
}) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return createPortal(
    <div
      className="ui-overlay"
      role="presentation"
      onMouseDown={e => { if (e.target === e.currentTarget) onClose?.() }}
    >
      <Tag
        className="ui-modal"
        role="dialog"
        aria-modal="true"
        aria-label={label}
        onSubmit={onSubmit}
      >
        <header className="ui-modal-head">
          <div>
            {kicker && <div className="ui-modal-kicker">{kicker}</div>}
            <h2 className="ui-modal-title">{title}</h2>
          </div>
          <button type="button" className="ui-iconbtn" onClick={onClose} aria-label="Close dialog">
            <CloseIcon size={14} />
          </button>
        </header>

        <div className="ui-modal-body">{children}</div>

        {footer && <footer className="ui-modal-foot">{footer}</footer>}
      </Tag>
    </div>,
    document.body,
  )
}
