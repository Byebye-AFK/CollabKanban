import React, { useEffect, useId, useRef, useState } from 'react'
import { SearchIcon, CloseIcon } from '../shell/icons'

// ── Gooey filter tuning ───────────────────────────────────────
// Blur radius and alpha contrast of the metaball filter. The pill and the
// icon dot merge while the gap between them is under ~7px, which is what
// makes the field look like it is pulled out of the icon.
const GOO_BLUR = 4
const GOO_CONTRAST = '1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -8'

/**
 * A search input that sits as a round icon and pulls a field out of itself
 * when focused, joined by a gooey (metaball) bridge while it moves.
 *
 * The goo filter would blur any text it touched, so it is applied to a
 * decorative layer of blobs that mirrors the real layout underneath.
 *
 * It stays open while it has focus or a value. `anchor="end"` grows the
 * field away from the right edge (for right-aligned headers); `"start"`
 * grows it from the left. Set the open width with `--gooey-w` in CSS.
 *
 * With `hotkey`, ⌘K / Ctrl-K focuses it from anywhere on the page — only
 * one field per page should claim that.
 */
export default function GooeyInput({
  value,
  onChange,
  placeholder = 'Search…',
  label = 'Search',
  type = 'text',
  anchor = 'end',
  hotkey = false,
  inputRef,
  className = '',
}) {
  const filterId = `gooey-${useId().replace(/:/g, '')}`
  const ownRef = useRef(null)
  const fieldRef = inputRef ?? ownRef
  const [hasFocus, setHasFocus] = useState(false)
  const isOpen = hasFocus || Boolean(value)

  useEffect(() => {
    if (!hotkey) return undefined
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        fieldRef.current?.focus()
        fieldRef.current?.select()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [hotkey, fieldRef])

  const handleBlur = (e) => {
    if (e.currentTarget.contains(e.relatedTarget)) return
    setHasFocus(false)
  }

  const handleKeyDown = (e) => {
    if (e.key !== 'Escape') return
    if (value) onChange?.('')
    else fieldRef.current?.blur()
  }

  const rootClass = [
    'gooey-input',
    anchor === 'start' ? 'is-start' : 'is-end',
    isOpen ? 'is-open' : '',
    className,
  ].filter(Boolean).join(' ')

  return (
    <div
      className={rootClass}
      onFocus={() => setHasFocus(true)}
      onBlur={handleBlur}
    >
      <svg className="gooey-defs" aria-hidden="true" focusable="false">
        <defs>
          <filter id={filterId} x="-20%" y="-60%" width="140%" height="220%" colorInterpolationFilters="sRGB">
            <feGaussianBlur in="SourceGraphic" stdDeviation={GOO_BLUR} result="blur" />
            <feColorMatrix in="blur" type="matrix" values={GOO_CONTRAST} />
          </filter>
        </defs>
      </svg>

      <div className="gooey-layer" aria-hidden="true" style={{ filter: `url(#${filterId})` }}>
        <span className="gooey-blob gooey-dot" />
        <span className="gooey-blob gooey-pill" />
      </div>

      <button
        type="button"
        className="gooey-trigger"
        onClick={() => fieldRef.current?.focus()}
        aria-label={label}
        tabIndex={-1}
      >
        <SearchIcon size={14} />
      </button>

      <div className="gooey-field">
        <input
          ref={fieldRef}
          type={type}
          name="search"
          value={value ?? ''}
          onChange={e => onChange?.(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label={label}
          autoComplete="off"
        />
        {value ? (
          <button
            type="button"
            className="ui-iconbtn is-sm"
            onClick={() => { onChange?.(''); fieldRef.current?.focus() }}
            aria-label="Clear search"
          >
            <CloseIcon size={12} />
          </button>
        ) : (
          hotkey && <span className="ui-kbd" aria-hidden="true">⌘K</span>
        )}
      </div>
    </div>
  )
}
