import React, { useMemo, useState } from 'react'
import Avatar from '../Avatar'

/**
 * WorkspaceList — every workspace the user belongs to, with its teams,
 * boards, member stack and role, on a glass panel.
 */

const SORTS = [
  { id: 'name',     label: 'Name (A–Z)' },
  { id: 'boards',   label: 'Most boards' },
]

export default function WorkspaceList({ workspaces, onOpenWorkspace, onCreateWorkspace }) {
  const [sort, setSort] = useState('name')
  const [menuOpen, setMenuOpen] = useState(false)

  const rows = useMemo(() => {
    const copy = [...workspaces]
    switch (sort) {
      case 'boards':   return copy.sort((a, b) => b.boards.length - a.boards.length)
      default:         return copy.sort((a, b) => a.name.localeCompare(b.name))
    }
  }, [workspaces, sort])

  return (
    <section className="dsh-panel dsh-glass dsh-in" style={{ '--in': '260ms' }} aria-label="Workspace list">
      <div className="dsh-panel-head">
        <div>
          <h2 className="dsh-sec-title">Workspace List</h2>
          <div className="dsh-sec-sub">
            {workspaces.length} workspaces · sorted by {SORTS.find(s => s.id === sort).label.toLowerCase()}
          </div>
        </div>

        <div className="dsh-panel-actions">
          <button
            className={`dsh-iconbtn${menuOpen ? ' is-on' : ''}`}
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Sort workspaces"
            aria-expanded={menuOpen}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="1.8" strokeLinecap="round">
              <path d="M4 7h16" /><path d="M7 12h10" /><path d="M10 17h4" />
            </svg>
          </button>

          <button className="dsh-cta" onClick={onCreateWorkspace}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14" /><path d="M5 12h14" /></svg>
            <span className="dsh-cta-text">New workspace</span>
          </button>

          {menuOpen && (
            <div className="dsh-menu" role="menu">
              {SORTS.map(s => (
                <button
                  key={s.id}
                  role="menuitem"
                  className={sort === s.id ? 'is-on' : undefined}
                  onClick={() => { setSort(s.id); setMenuOpen(false) }}
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
              <th>Your Role</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td className="dsh-empty" colSpan={5}>You aren't in any workspace yet.</td></tr>
            )}
            {rows.map((ws) => {
              const shown = ws.members.slice(0, 3)
              const extra = ws.members.length - shown.length
              return (
                <tr key={ws.workspaceId} onClick={() => onOpenWorkspace?.(ws)}>
                  <td>
                    <div className="dsh-ws-cell">
                      <span className="dsh-ws-name">{ws.name}</span>
                    </div>
                  </td>
                  <td>
                    <div className="dsh-chiprow">
                      {ws.teams.slice(0, 3).map(t => <span key={t.id} className="dsh-chip">{t.name}</span>)}
                      {ws.teams.length > 3 && <span className="dsh-chip">+{ws.teams.length - 3}</span>}
                    </div>
                  </td>
                  <td className="dsh-cell-text">{ws.boards.length} board{ws.boards.length === 1 ? '' : 's'}</td>
                  <td>
                    <div className="dsh-stack">
                      {shown.map(m => <span key={m}><Avatar name={m} size={28} /></span>)}
                      {extra > 0 && <span className="dsh-more">+{extra}</span>}
                    </div>
                  </td>
                  <td><span className={`dsh-role ${ws.role}`}>{ws.role}</span></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
