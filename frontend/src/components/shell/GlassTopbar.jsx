import React, { useState } from 'react'
import Avatar from '../Avatar'
import useHideOnScrollDown from '../../hooks/useHideOnScrollDown'
import { SearchIcon, CollapseIcon } from './icons'

/**
 * The floating top bar: rail toggle, search, an action slot, avatar.
 *
 * It owns two behaviours that every page wants identically:
 *
 *  - Focusing the search expands it across the whole bar and folds the
 *    actions away. It stays expanded while there is a query, so the
 *    field never snaps shut as focus moves to the results below.
 *  - Scrolling down lifts the bar out of the frame; scrolling back up
 *    returns it. Never while the search is in use — an expanded field
 *    outranks the scroll, so the bar can't vanish from under the user.
 */
export default function GlassTopbar({
  scrollRef,
  ready = true,
  collapsed = false,
  onToggleCollapse,
  query = '',
  onQueryChange,
  searchPlaceholder = 'Search…',
  searchLabel = 'Search',
  user,
  children,
}) {
  const [isSearchFocused, setSearchFocused] = useState(false)

  const isSearchExpanded = isSearchFocused || query.trim() !== ''
  const isHidden = useHideOnScrollDown(scrollRef, ready && !isSearchExpanded)

  return (
    <header
      className={`dsh-topbar dsh-glass${isSearchExpanded ? ' is-searching' : ''}` +
        `${isHidden ? ' is-hidden' : ''}`}
      aria-hidden={isHidden}
    >
      {onToggleCollapse && (
        <button
          className="dsh-iconbtn dsh-collapse"
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!collapsed}
        >
          <CollapseIcon style={{ transform: collapsed ? 'scaleX(-1)' : 'none' }} />
        </button>
      )}

      <div className="dsh-search">
        <SearchIcon />
        <input
          name="search"
          placeholder={searchPlaceholder}
          value={query}
          onChange={e => onQueryChange?.(e.target.value)}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          aria-label={searchLabel}
        />
      </div>

      <div className="dsh-spacer" />

      {children}

      <span className="dsh-avatar-ring"><Avatar name={user?.name || 'Guest'} size={32} /></span>
    </header>
  )
}
