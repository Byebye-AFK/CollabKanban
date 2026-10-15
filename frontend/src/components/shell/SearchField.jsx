import React, { useEffect, useRef } from 'react'
import { SearchIcon, CloseIcon } from './icons'

/**
 * A quiet inline search: an icon and a field with no box until it is
 * hovered or focused.
 *
 * Escape clears it. With `hotkey`, ⌘K / Ctrl-K focuses it from anywhere
 * on the page — only one field per page should claim that.
 */
export default function SearchField({
  value,
  onChange,
  placeholder = 'Search…',
  label = 'Search',
  hotkey = false,
  className = '',
}) {
  const inputRef = useRef(null)

  useEffect(() => {
    if (!hotkey) return undefined
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        inputRef.current?.select()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [hotkey])

  return (
    <div className={`ui-search ${className}`.trim()}>
      <SearchIcon size={14} />
      <input
        ref={inputRef}
        name="search"
        value={value}
        onChange={e => onChange?.(e.target.value)}
        onKeyDown={e => { if (e.key === 'Escape') onChange?.('') }}
        placeholder={placeholder}
        aria-label={label}
        autoComplete="off"
      />
      {value ? (
        <button
          type="button"
          className="ui-iconbtn is-sm"
          onClick={() => { onChange?.(''); inputRef.current?.focus() }}
          aria-label="Clear search"
        >
          <CloseIcon size={12} />
        </button>
      ) : (
        hotkey && <span className="ui-kbd" aria-hidden="true">⌘K</span>
      )}
    </div>
  )
}
