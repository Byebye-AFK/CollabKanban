import React, { useCallback, useRef, useState } from 'react'
import { DisplayIcon } from '../shell/icons'
import { useDismiss } from '../../hooks/useDismiss'

/**
 * The board's "Display" popover: how cards and columns are shown.
 *
 * Holds no state of its own beyond being open — the options live in
 * boardPrefsApi, and each switch reports only the option it flipped.
 */
const OPTIONS = [
  { key: 'showDescriptions', label: 'Show descriptions' },
  { key: 'showEmptyColumns', label: 'Show empty columns' },
]

export default function DisplayMenu({ display, onChange }) {
  const [isOpen, setOpen] = useState(false)
  const rootRef = useRef(null)
  const close = useCallback(() => setOpen(false), [])
  useDismiss(rootRef, isOpen, close)

  return (
    <div className="brd-display" ref={rootRef}>
      <button
        className={`ui-btn${isOpen ? ' is-on' : ''}`}
        onClick={() => setOpen(o => !o)}
        aria-expanded={isOpen}
      >
        <DisplayIcon size={14} />
        Display
      </button>

      {isOpen && (
        <div className="ui-menu brd-display-menu" role="group" aria-label="Display options">
          <div className="ui-menu-label">Display options</div>
          {OPTIONS.map(({ key, label }) => (
            <label key={key} className="ui-switchrow">
              <span>{label}</span>
              <input
                type="checkbox"
                checked={Boolean(display?.[key])}
                onChange={e => onChange?.({ [key]: e.target.checked })}
              />
              <span className="ui-switch" aria-hidden="true" />
            </label>
          ))}
        </div>
      )}
    </div>
  )
}
