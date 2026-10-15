import React, { useCallback, useMemo, useRef, useState } from 'react'
import Avatar from '../Avatar'
import { SortIcon, PlusIcon } from '../shell/icons'
import { colorFor } from '../shell/palette'
import { useDismiss } from '../../hooks/useDismiss'

/**
 * WorkspaceList — every workspace the user belongs to, with its teams,
 * boards, members and the user's role, as a bordered table.
 */

const SORTS = [
  { id: 'name',     label: 'Name (A–Z)' },
  { id: 'boards',   label: 'Most boards' },
]

/** Members and teams shown before collapsing into a +N. */
const MAX_SHOWN = 3

export default function WorkspaceList({ workspaces, onOpenWorkspace, onCreateWorkspace }) {
  const [sort, setSort] = useState('name')
  const [menuOpen, setMenuOpen] = useState(false)
  const actionsRef = useRef(null)
  const closeMenu = useCallback(() => setMenuOpen(false), [])
  useDismiss(actionsRef, menuOpen, closeMenu)

  const rows = useMemo(() => {
    const copy = [...workspaces]
    switch (sort) {
      case 'boards':   return copy.sort((a, b) => b.boards.length - a.boards.length)
      default:         return copy.sort((a, b) => a.name.localeCompare(b.name))
    }
  }, [workspaces, sort])

  return (
    <section className="app-panel ui-in" style={{ '--in': '200ms' }} aria-label="Workspace list">
      <div className="app-panel-head">
        <h2 className="app-panel-title">Workspaces</h2>
        <span className="app-meta">
          {workspaces.length} · sorted by {SORTS.find(s => s.id === sort).label.toLowerCase()}
        </span>

        <div className="app-panel-actions" ref={actionsRef}>
          <button
            className={`ui-iconbtn${menuOpen ? ' is-on' : ''}`}
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Sort workspaces"
            aria-expanded={menuOpen}
          >
            <SortIcon />
          </button>

          <button className="ui-btn" onClick={onCreateWorkspace}>
            <PlusIcon size={12} />
            New workspace
          </button>

          {menuOpen && (
            <div className="ui-menu" role="menu">
              {SORTS.map(s => (
                <button
                  key={s.id}
                  role="menuitem"
                  className={sort === s.id ? 'is-on' : undefined}
                  onClick={() => { setSort(s.id); closeMenu() }}
                >
                  {s.label}{sort === s.id && <span>✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="dsh-tablewrap">
        <table className="dsh-table">
          <thead>
            <tr>
              <th>Workspace</th>
              <th>Teams</th>
              <th>Boards</th>
              <th>Members</th>
              <th>Your role</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td className="ui-empty" colSpan={5}>You aren't in any workspace yet.</td></tr>
            )}
            {rows.map((ws) => {
              const shown = ws.members.slice(0, MAX_SHOWN)
              const extra = ws.members.length - shown.length
              return (
                <tr key={ws.workspaceId} onClick={() => onOpenWorkspace?.(ws)}>
                  <td>
                    <span className="dsh-ws-cell">
                      <span className="app-ws-mark" style={{ '--c': colorFor(ws.name) }} aria-hidden="true">
                        {ws.name.charAt(0).toUpperCase()}
                      </span>
                      <span className="dsh-ws-name">{ws.name}</span>
                    </span>
                  </td>
                  <td>
                    <span className="dsh-chiprow">
                      {ws.teams.slice(0, MAX_SHOWN).map(t => <span key={t.id} className="ui-chip">{t.name}</span>)}
                      {ws.teams.length > MAX_SHOWN && <span className="ui-chip">+{ws.teams.length - MAX_SHOWN}</span>}
                    </span>
                  </td>
                  <td className="dsh-cell-muted">{ws.boards.length} board{ws.boards.length === 1 ? '' : 's'}</td>
                  <td>
                    <span className="ui-avatars">
                      {shown.map(m => <Avatar key={m} name={m} size={20} />)}
                      {extra > 0 && <span className="ui-avatar is-more" style={{ '--size': '20px' }}>+{extra}</span>}
                    </span>
                  </td>
                  <td><span className="dsh-role">{ws.role.toLowerCase()}</span></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
