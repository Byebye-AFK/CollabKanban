import React, { useEffect, useRef } from 'react'

/**
 * Glass top bar for the board.
 *
 * The search field sits in a flexible middle cell so it stays optically
 * centred over the board regardless of how long the breadcrumb runs.
 * ⌘K / Ctrl-K focuses it, Escape clears it.
 */
const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.9" strokeLinecap="round">
    <circle cx="11" cy="11" r="7" /><path d="m20 20-3.6-3.6" />
  </svg>
)

const CloseIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.6" strokeLinecap="round">
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
)

export default function BoardTopbar({
  boardName,
  workspaceName,
  query,
  onQueryChange,
  collapsed,
  onToggleCollapse,
  onAddColumn,
  matchLabel,
}) {
  const inputRef = useRef(null)

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        inputRef.current?.select()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <header className="brd-topbar brd-glass">
      <button
        className="brd-iconbtn brd-collapse"
        onClick={onToggleCollapse}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        aria-expanded={!collapsed}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: collapsed ? 'scaleX(-1)' : 'none' }}>
          <path d="M20 12H5" /><path d="m10 7-5 5 5 5" />
        </svg>
      </button>

      <div className="brd-crumb">
        {workspaceName && (
          <>
            <span className="brd-crumb-ws">{workspaceName}</span>
            <span className="brd-crumb-sep">/</span>
          </>
        )}
        <span className="brd-crumb-name" title={boardName}>{boardName}</span>
      </div>

      <div className="brd-topbar-mid">
        <div className="brd-search">
          <SearchIcon />
          <input
            ref={inputRef}
            value={query}
            onChange={e => onQueryChange(e.target.value)}
            onKeyDown={e => { if (e.key === 'Escape') onQueryChange('') }}
            placeholder="Search cards on this board…"
            aria-label="Search cards"
          />
          {query
            ? (
              <button
                className="brd-search-clear"
                onClick={() => { onQueryChange(''); inputRef.current?.focus() }}
                aria-label="Clear search"
              >
                <CloseIcon />
              </button>
            )
            : <span className="brd-kbd">⌘K</span>}
        </div>
      </div>

      <div className="brd-topbar-right">
        {matchLabel && <span className="brd-crumb-ws">{matchLabel}</span>}
        <button className="brd-btn" onClick={onAddColumn}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2.2" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          <span className="brd-btn-label">Add column</span>
        </button>
      </div>
    </header>
  )
}
