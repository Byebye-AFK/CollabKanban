import React, { useEffect, useRef, useState } from 'react'
import { SortIcon, GroupIcon, ListIcon } from '../shell/icons'

/**
 * The toolbar row above a library list: its title and count on the
 * left, the grouped/flat switch and the sort menu on the right.
 *
 * Search lives in the page header rather than here — there is only ever
 * one search on a page, and the header stays put as the list scrolls.
 */
const VIEWS = [
  { id: 'grouped', label: 'Grouped', Icon: GroupIcon },
  { id: 'flat', label: 'All', Icon: ListIcon },
]

export default function LibraryToolbar({
  title,
  noun,
  count,
  total,
  sorts,
  sort,
  onSortChange,
  view,
  onViewChange,
  flatLabel = 'All',
  children,
}) {
  const [isMenuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  // A menu that survives a click elsewhere on the page reads as stuck.
  useEffect(() => {
    if (!isMenuOpen) return
    const onPointerDown = e => {
      if (!menuRef.current?.contains(e.target)) setMenuOpen(false)
    }
    const onKeyDown = e => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [isMenuOpen])

  const sortLabel = sorts.find(s => s.id === sort)?.label ?? sorts[0].label
  const isFiltered = count !== total
  const plural = total === 1 ? noun : `${noun}s`

  return (
    <div className="app-toolbar lib-toolbar">
      <h2 className="lib-toolbar-title">{title}</h2>
      <span className="app-meta">
        {isFiltered ? `${count} of ${total} ${noun}s` : `${total} ${plural}`}
        {' · sorted by '}{sortLabel.toLowerCase()}
      </span>

      <div className="app-toolbar-right" ref={menuRef}>
        <div className="app-segment" role="group" aria-label={`${noun} grouping`}>
          {VIEWS.map(({ id, label, Icon }) => (
            <button
              key={id}
              className={view === id ? 'is-on' : undefined}
              onClick={() => onViewChange(id)}
              aria-pressed={view === id}
            >
              <Icon size={14} />
              <span>{id === 'flat' ? flatLabel : label}</span>
            </button>
          ))}
        </div>

        <button
          className={`ui-iconbtn${isMenuOpen ? ' is-on' : ''}`}
          onClick={() => setMenuOpen(o => !o)}
          aria-label={`Sort ${noun}s`}
          aria-expanded={isMenuOpen}
        >
          <SortIcon />
        </button>

        {children}

        {isMenuOpen && (
          <div className="ui-menu lib-sortmenu" role="menu">
            <div className="ui-menu-label">Sort by</div>
            {sorts.map(s => (
              <button
                key={s.id}
                role="menuitem"
                className={sort === s.id ? 'is-on' : undefined}
                onClick={() => { onSortChange(s.id); setMenuOpen(false) }}
              >
                {s.label}{sort === s.id && <span>✓</span>}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
