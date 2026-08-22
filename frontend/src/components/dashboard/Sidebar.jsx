import React, { useState } from 'react'

/**
 * Icon rail for the dashboard.
 * Stroke icons instead of emoji so weight stays consistent at every size.
 */
const Icon = ({ d, fill }) => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} fill={fill || 'none'} />) : <path d={d} />}
  </svg>
)

export const NAV = [
  { id: 'dashboard',  label: 'Dashboard',  d: ['M4 4h7v7H4z', 'M13 4h7v4h-7z', 'M13 10h7v10h-7z', 'M4 13h7v7H4z'] },
  { id: 'graph',      label: 'Graph view', d: ['M12 5.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5z', 'M5 16a2 2 0 1 1 0 4 2 2 0 0 1 0-4z', 'M19 16a2 2 0 1 1 0 4 2 2 0 0 1 0-4z', 'M10.4 10.2 6.3 15.1', 'M13.6 10.2l4.1 4.9'] },
  { id: 'workspaces', label: 'Workspaces', d: ['M3 7.5 12 3l9 4.5-9 4.5-9-4.5z', 'M3 12l9 4.5 9-4.5', 'M3 16.5 12 21l9-4.5'] },
  { id: 'teams',      label: 'Teams',      d: ['M16 20v-1.5a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4V20', 'M9 10.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z', 'M22 20v-1.5a4 4 0 0 0-3-3.87', 'M16 3.6a4 4 0 0 1 0 7.75'] },
  { id: 'boards',     label: 'Boards',     d: ['M3 4.5h18v15H3z', 'M9 4.5v15', 'M15 4.5v15'] },
  { id: 'starred',    label: 'Starred',    d: ['M12 3.5l2.6 5.4 5.9.8-4.3 4.2 1 5.9-5.2-2.8-5.2 2.8 1-5.9L3.5 9.7l5.9-.8z'] },
  { id: 'activity',   label: 'Activity',   d: ['M3 12h4l2.5-7 5 14L17 12h4'] },
  { id: 'settings',   label: 'Settings',   d: ['M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4z', 'M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1v.2a2 2 0 0 1-4 0v-.1a1.6 1.6 0 0 0-2.8-1.1l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 3.4 15H3a2 2 0 0 1 0-4h.2A1.6 1.6 0 0 0 4.3 8.2l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 9.9 4.3V4a2 2 0 1 1 4 0v.2a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0 1.1 2.7h.2a2 2 0 0 1 0 4h-.2a1.6 1.6 0 0 0-1.1.9z'] },
]

const css = {
  rail: {
    width: 62,
    flexShrink: 0,
    background: 'var(--bg-base)',
    borderRight: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '14px 0 16px',
    gap: 4,
    zIndex: 30,
  },
  logo: {
    width: 34,
    height: 34,
    borderRadius: 10,
    background: 'linear-gradient(140deg, var(--accent), #4F9CF9)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontSize: 16,
    fontWeight: 700,
    marginBottom: 14,
    boxShadow: '0 4px 14px rgba(124,111,247,0.35)',
    userSelect: 'none',
  },
  itemWrap: { position: 'relative', display: 'flex', justifyContent: 'center', width: '100%' },
  item: (active, hovered) => ({
    width: 38,
    height: 38,
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: active ? 'var(--accent-light)' : hovered ? 'var(--bg-card)' : 'transparent',
    color: active ? 'var(--accent)' : hovered ? 'var(--text-primary)' : 'var(--text-muted)',
    cursor: 'pointer',
    transition: 'background var(--transition-fast), color var(--transition-fast)',
  }),
  marker: {
    position: 'absolute',
    left: 0,
    top: 9,
    width: 3,
    height: 20,
    borderRadius: '0 3px 3px 0',
    background: 'var(--accent)',
  },
  tip: {
    position: 'absolute',
    left: 50,
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'var(--bg-modal)',
    border: '1px solid var(--border-input)',
    color: 'var(--text-primary)',
    fontSize: 12,
    fontWeight: 500,
    padding: '5px 9px',
    borderRadius: 7,
    whiteSpace: 'nowrap',
    boxShadow: 'var(--shadow-modal)',
    pointerEvents: 'none',
    zIndex: 60,
  },
  spacer: { flex: 1 },
  divider: { width: 26, height: 1, background: 'var(--border)', margin: '8px 0' },
}

function RailItem({ item, active, onClick }) {
  const [hover, setHover] = useState(false)
  return (
    <div style={css.itemWrap}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}>
      {active && <div style={css.marker} />}
      <button
        style={css.item(active, hover)}
        onClick={onClick}
        aria-label={item.label}
        aria-current={active ? 'page' : undefined}
      >
        <Icon d={item.d} />
      </button>
      {hover && <span style={css.tip} role="tooltip">{item.label}</span>}
    </div>
  )
}

export default function Sidebar({ active = 'dashboard', onNavigate, onSignOut }) {
  return (
    <nav style={css.rail} aria-label="Primary">
      <div style={css.logo}>⊞</div>

      {NAV.map(item => (
        <RailItem
          key={item.id}
          item={item}
          active={active === item.id}
          onClick={() => onNavigate?.(item.id)}
        />
      ))}

      <div style={css.spacer} />
      <div style={css.divider} />
      <RailItem
        item={{ id: 'signout', label: 'Sign out', d: ['M15 17l5-5-5-5', 'M20 12H9', 'M11 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h5'] }}
        active={false}
        onClick={onSignOut}
      />
    </nav>
  )
}
