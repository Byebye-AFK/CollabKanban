import React, { useEffect, useRef, useState } from 'react'
import { SortIcon, GroupIcon, GridIcon } from '../shell/icons'

/**
 * Heading strip for a library grid: a count, the grouped/flat switch
 * and the sort menu.
 *
 * Search lives in the top bar rather than here — there is only ever one
 * search on a page, and putting it in the bar keeps it reachable once
 * the grid has scrolled past this strip.
 */
const VIEWS = [
  { id: 'grouped', label: 'Grouped', Icon: GroupIcon },
  { id: 'flat', label: 'All', Icon: GridIcon },
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
    <div className="dsh-panel-head lib-toolbar">
      <div>
        <h2 className="dsh-sec-title">{title}</h2>
        <div className="dsh-sec-sub">
          {isFiltered ? `${count} of ${total} ${noun}s` : `${total} ${plural}`}
          {' · sorted by '}{sortLabel.toLowerCase()}
        </div>
      </div>

      <div className="dsh-panel-actions" ref={menuRef}>
        <div className="lib-viewtoggle" role="group" aria-label={`${noun} grouping`}>
          {VIEWS.map(({ id, label, Icon }) => (
            <button
              key={id}
              className={`lib-viewbtn${view === id ? ' is-on' : ''}`}
              onClick={() => onViewChange(id)}
              aria-pressed={view === id}
            >
              <Icon />
              <span>{id === 'flat' ? flatLabel : label}</span>
            </button>
          ))}
        </div>

        <button
          className={`dsh-iconbtn${isMenuOpen ? ' is-on' : ''}`}
          onClick={() => setMenuOpen(o => !o)}
          aria-label={`Sort ${noun}s`}
          aria-expanded={isMenuOpen}
        >
          <SortIcon />
        </button>

        {children}

        {isMenuOpen && (
          <div className="dsh-menu" role="menu">
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
