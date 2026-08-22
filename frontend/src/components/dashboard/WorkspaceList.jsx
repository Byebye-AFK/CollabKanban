import React, { useMemo, useState } from 'react'
import Avatar from '../Avatar'

/**
 * WorkspaceList — every workspace the user belongs to, with its teams,
 * boards, member stack, role and completion.
 */
const ROLE_STYLE = {
  OWNER:  { bg: 'rgba(124,111,247,0.16)', fg: '#A99BFF' },
  ADMIN:  { bg: 'rgba(79,156,249,0.16)',  fg: '#7CB8FF' },
  MEMBER: { bg: 'rgba(139,144,167,0.14)', fg: '#9AA0B8' },
}

const css = {
  section: {
    background: 'var(--bg-column)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '18px 20px 8px',
  },
  head: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    gap: 12, marginBottom: 16, flexWrap: 'wrap',
  },
  title: { fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' },
  sub: { fontSize: 12, color: 'var(--text-muted)', marginTop: 2 },
  actions: { display: 'flex', alignItems: 'center', gap: 8, position: 'relative' },
  iconBtn: (active) => ({
    width: 34, height: 34, borderRadius: 'var(--radius-sm)',
    background: active ? 'var(--accent-light)' : 'var(--bg-card)',
    border: `1px solid ${active ? 'var(--border-focus)' : 'var(--border-input)'}`,
    color: active ? 'var(--accent)' : 'var(--text-secondary)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
  }),
  primaryBtn: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: 'var(--accent)', color: '#fff', fontSize: 13, fontWeight: 600,
    borderRadius: 'var(--radius-sm)', padding: '9px 14px', cursor: 'pointer',
    border: 'none', transition: 'background var(--transition-fast)',
  },
  menu: {
    position: 'absolute', top: 40, right: 0, minWidth: 168, zIndex: 40,
    background: 'var(--bg-modal)', border: '1px solid var(--border-input)',
    borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-modal)',
    padding: 5, animation: 'fadeIn 120ms ease',
  },
  menuItem: (active) => ({
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    width: '100%', padding: '8px 10px', borderRadius: 7, background: 'transparent',
    color: active ? 'var(--accent)' : 'var(--text-secondary)',
    fontSize: 13, fontWeight: 500, cursor: 'pointer', textAlign: 'left',
  }),
  scroll: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', minWidth: 760 },
  th: {
    textAlign: 'left', fontSize: 11.5, fontWeight: 600, color: 'var(--text-muted)',
    letterSpacing: '0.04em', padding: '0 14px 10px', whiteSpace: 'nowrap',
    borderBottom: '1px solid var(--border)',
  },
  td: { padding: '13px 14px', borderBottom: '1px solid var(--border)', verticalAlign: 'middle' },
  nameCell: { display: 'flex', alignItems: 'center', gap: 11 },
  wsMark: (color) => ({
    width: 32, height: 32, borderRadius: 9, flexShrink: 0,
    background: `linear-gradient(140deg, ${color}, ${color}66)`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontSize: 13, fontWeight: 700,
  }),
  wsName: { fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)' },
  wsId: { fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, marginTop: 1 },
  chipRow: { display: 'flex', flexWrap: 'wrap', gap: 5 },
  chip: {
    fontSize: 11, fontWeight: 500, color: 'var(--text-secondary)',
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 99, padding: '3px 8px', whiteSpace: 'nowrap',
  },
  cellText: { fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500, whiteSpace: 'nowrap' },
  stack: { display: 'flex', alignItems: 'center' },
  stackItem: { marginLeft: -8, border: '2px solid var(--bg-column)', borderRadius: '50%' },
  more: {
    marginLeft: -8, width: 26, height: 26, borderRadius: '50%',
    background: 'var(--bg-card)', border: '2px solid var(--bg-column)',
    color: 'var(--text-secondary)', fontSize: 10, fontWeight: 600,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  roleBadge: (role) => ({
    display: 'inline-block', fontSize: 11, fontWeight: 600, letterSpacing: '0.03em',
    padding: '4px 9px', borderRadius: 6,
    background: (ROLE_STYLE[role] || ROLE_STYLE.MEMBER).bg,
    color: (ROLE_STYLE[role] || ROLE_STYLE.MEMBER).fg,
  }),
  progressCell: { display: 'flex', alignItems: 'center', gap: 10, minWidth: 150 },
  track: { flex: 1, height: 6, borderRadius: 99, background: 'var(--bg-input)', overflow: 'hidden' },
  fill: (pct, color) => ({ height: '100%', width: `${pct}%`, background: color, borderRadius: 99 }),
  pct: { fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', width: 34, textAlign: 'right' },
  empty: { padding: '34px 14px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 },
}

const SORTS = [
  { id: 'recent',   label: 'Recently active' },
  { id: 'name',     label: 'Name (A–Z)' },
  { id: 'progress', label: 'Progress' },
  { id: 'boards',   label: 'Most boards' },
]

const COLORS = ['#7C6FF7', '#4F9CF9', '#34D399', '#FBBF24', '#F87171', '#A78BFA']

const progressColor = (pct) =>
  pct >= 80 ? 'var(--success)' : pct >= 45 ? 'var(--accent)' : 'var(--warning)'

export default function WorkspaceList({ workspaces, onOpenWorkspace, onCreateWorkspace, relativeTime }) {
  const [sort, setSort] = useState('recent')
  const [menuOpen, setMenuOpen] = useState(false)

  const rows = useMemo(() => {
    const copy = [...workspaces]
    switch (sort) {
      case 'name':     return copy.sort((a, b) => a.name.localeCompare(b.name))
      case 'progress': return copy.sort((a, b) => b.progress - a.progress)
      case 'boards':   return copy.sort((a, b) => b.boards.length - a.boards.length)
      default:         return copy.sort((a, b) => b.lastActive - a.lastActive)
    }
  }, [workspaces, sort])

  return (
    <section style={css.section} aria-label="Workspace list">
      <div style={css.head}>
        <div>
          <h2 style={css.title}>Workspace List</h2>
          <div style={css.sub}>{workspaces.length} workspaces · sorted by {SORTS.find(s => s.id === sort).label.toLowerCase()}</div>
        </div>
        <div style={css.actions}>
          <button
            style={css.iconBtn(menuOpen)}
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Sort workspaces"
            aria-expanded={menuOpen}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="1.8" strokeLinecap="round">
              <path d="M4 7h16" /><path d="M7 12h10" /><path d="M10 17h4" />
            </svg>
          </button>
          <button
            style={css.primaryBtn}
            onClick={onCreateWorkspace}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-hover)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent)' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2.2" strokeLinecap="round"><path d="M12 5v14" /><path d="M5 12h14" /></svg>
            New workspace
          </button>

          {menuOpen && (
            <div style={css.menu} role="menu">
              {SORTS.map(s => (
                <button
                  key={s.id}
                  role="menuitem"
                  style={css.menuItem(sort === s.id)}
                  onClick={() => { setSort(s.id); setMenuOpen(false) }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-card)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                >
                  {s.label}{sort === s.id && <span>✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={css.scroll}>
        <table style={css.table}>
          <thead>
            <tr>
              <th style={css.th}>Workspace</th>
              <th style={css.th}>Teams</th>
              <th style={css.th}>Boards</th>
              <th style={css.th}>Members</th>
              <th style={css.th}>Your Role</th>
              <th style={css.th}>Cards Done</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td style={css.empty} colSpan={6}>You aren't in any workspace yet.</td></tr>
            )}
            {rows.map((ws, i) => {
              const color = COLORS[i % COLORS.length]
              const shown = ws.members.slice(0, 3)
              const extra = ws.members.length - shown.length
              return (
                <tr
                  key={ws.workspaceId}
                  onClick={() => onOpenWorkspace?.(ws)}
                  style={{ cursor: 'pointer', transition: 'background var(--transition-fast)' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-card)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                >
                  <td style={css.td}>
                    <div style={css.nameCell}>
                      <div style={css.wsMark(color)}>{ws.name.slice(0, 1)}</div>
                      <div>
                        <div style={css.wsName}>{ws.name}</div>
                        <div style={css.wsId}>ID {String(ws.workspaceId).padStart(6, '0')} · {relativeTime(ws.lastActive)}</div>
                      </div>
                    </div>
                  </td>
                  <td style={css.td}>
                    <div style={css.chipRow}>
                      {ws.teams.slice(0, 3).map(t => <span key={t.id} style={css.chip}>{t.name}</span>)}
                      {ws.teams.length > 3 && <span style={css.chip}>+{ws.teams.length - 3}</span>}
                    </div>
                  </td>
                  <td style={{ ...css.td, ...css.cellText }}>{ws.boards.length} boards</td>
                  <td style={css.td}>
                    <div style={css.stack}>
                      {shown.map(m => (
                        <span key={m} style={css.stackItem}><Avatar name={m} size={26} /></span>
                      ))}
                      {extra > 0 && <span style={css.more}>+{extra}</span>}
                    </div>
                  </td>
                  <td style={css.td}><span style={css.roleBadge(ws.role)}>{ws.role}</span></td>
                  <td style={css.td}>
                    <div style={css.progressCell}>
                      <div style={css.track}>
                        <div style={css.fill(ws.progress, progressColor(ws.progress))} />
                      </div>
                      <span style={css.pct}>{ws.progress}%</span>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
