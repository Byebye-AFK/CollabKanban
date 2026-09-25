import React from 'react'
import Avatar from '../Avatar'

/**
 * Glass sidebar for the dashboard.
 *
 * Expanded it reads as a labelled nav panel; collapsed it becomes an icon
 * rail with tooltips. Stroke icons throughout so weight stays consistent
 * at both widths.
 */
const Icon = ({ d, size = 19 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    {(Array.isArray(d) ? d : [d]).map((p, i) => <path key={i} d={p} />)}
  </svg>
)

export const NAV = [
  { id: 'dashboard',  label: 'Dashboard',  group: 'Workspace', d: ['M4 4h7v7H4z', 'M13 4h7v4h-7z', 'M13 10h7v10h-7z', 'M4 13h7v7H4z'] },
  { id: 'graph',      label: 'Graph view', group: 'Workspace', d: ['M12 5.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5z', 'M5 16a2 2 0 1 1 0 4 2 2 0 0 1 0-4z', 'M19 16a2 2 0 1 1 0 4 2 2 0 0 1 0-4z', 'M10.4 10.2 6.3 15.1', 'M13.6 10.2l4.1 4.9'] },
  { id: 'workspaces', label: 'Workspaces', group: 'Workspace', d: ['M3 7.5 12 3l9 4.5-9 4.5-9-4.5z', 'M3 12l9 4.5 9-4.5', 'M3 16.5 12 21l9-4.5'] },
  { id: 'teams',      label: 'Teams',      group: 'Workspace', d: ['M16 20v-1.5a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4V20', 'M9 10.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z', 'M22 20v-1.5a4 4 0 0 0-3-3.87', 'M16 3.6a4 4 0 0 1 0 7.75'] },
  { id: 'boards',     label: 'Boards',     group: 'Library',   d: ['M3 4.5h18v15H3z', 'M9 4.5v15', 'M15 4.5v15'] },
  { id: 'starred',    label: 'Starred',    group: 'Library',   d: ['M12 3.5l2.6 5.4 5.9.8-4.3 4.2 1 5.9-5.2-2.8-5.2 2.8 1-5.9L3.5 9.7l5.9-.8z'] },
  { id: 'settings',   label: 'Settings',   group: 'Library',   d: ['M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4z', 'M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1v.2a2 2 0 0 1-4 0v-.1a1.6 1.6 0 0 0-2.8-1.1l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 3.4 15H3a2 2 0 0 1 0-4h.2A1.6 1.6 0 0 0 4.3 8.2l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 9.9 4.3V4a2 2 0 1 1 4 0v.2a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0 1.1 2.7h.2a2 2 0 0 1 0 4h-.2a1.6 1.6 0 0 0-1.1.9z'] },
]

const SIGN_OUT = {
  id: 'signout',
  label: 'Sign out',
  d: ['M15 17l5-5-5-5', 'M20 12H9', 'M11 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h5'],
}

function NavItem({ item, active, onClick }) {
  return (
    <div className="dsh-navwrap">
      <button
        className={`dsh-navitem${active ? ' is-active' : ''}`}
        onClick={onClick}
        aria-current={active ? 'page' : undefined}
        aria-label={item.label}
      >
        <Icon d={item.d} />
        <span className="dsh-navtext">{item.label}</span>
      </button>
      <span className="dsh-tip" role="tooltip">{item.label}</span>
    </div>
  )
}

export default function Sidebar({ active = 'dashboard', collapsed = false, user, onNavigate, onSignOut }) {
  // Group headings are rendered from the nav table itself, so adding an
  // item never means touching the markup below.
  const groups = NAV.reduce((acc, item) => {
    const g = acc.find(x => x.name === item.group)
    if (g) g.items.push(item)
    else acc.push({ name: item.group, items: [item] })
    return acc
  }, [])

  return (
    <nav className={`dsh-rail dsh-glass${collapsed ? ' is-collapsed' : ''}`} aria-label="Primary">
      <div className="dsh-brand">
        <span className="dsh-mark" aria-hidden="true"><i /><i /><i /><i /></span>
        <span className="dsh-brand-name">CollabKanban</span>
      </div>

      {groups.map(group => (
        <React.Fragment key={group.name}>
          <div className="dsh-navlabel"><span className="dsh-navlabel-text">{group.name}</span></div>
          {group.items.map(item => (
            <NavItem
              key={item.id}
              item={item}
              active={active === item.id}
              onClick={() => onNavigate?.(item.id)}
            />
          ))}
        </React.Fragment>
      ))}

      <div className="dsh-rail-foot">
        <div className="dsh-rail-sep" />
        <div className="dsh-usercard">
          <Avatar name={user?.name || 'Guest'} size={32} />
          <div className="dsh-user-meta">
            <div className="dsh-user-name">{user?.name || 'Guest'}</div>
            <div className="dsh-user-mail">{user?.email || 'not signed in'}</div>
          </div>
        </div>
        <NavItem item={SIGN_OUT} active={false} onClick={onSignOut} />
      </div>
    </nav>
  )
}
