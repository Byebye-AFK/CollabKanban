import React from 'react'
import Avatar from '../Avatar'
import { columnColor } from '../KanbanColumn'

/**
 * Glass rail for the board view.
 *
 * Doubles as a legend: every column on the board is listed with its
 * accent swatch and card count, and clicking one scrolls the stage to
 * it. Collapsed it becomes an icon strip with tooltips, matching the
 * dashboard rail.
 */
const Icon = ({ d, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    {(Array.isArray(d) ? d : [d]).map((p, i) => <path key={i} d={p} />)}
  </svg>
)

const PATH = {
  back:     ['M15 18l-6-6 6-6'],
  plus:     ['M12 5v14', 'M5 12h14'],
  refresh:  ['M21 12a9 9 0 1 1-2.6-6.4', 'M21 3v6h-6'],
  columns:  ['M3 4.5h18v15H3z', 'M9 4.5v15', 'M15 4.5v15'],
  signout:  ['M15 17l5-5-5-5', 'M20 12H9', 'M11 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h5'],
}

/** Nav row plus the tooltip that only shows while the rail is collapsed. */
function Row({ label, children, onClick, active, title }) {
  return (
    <div className="brd-navwrap">
      <button
        className={`brd-navitem${active ? ' is-active' : ''}`}
        onClick={onClick}
        title={title}
        aria-label={label}
      >
        {children}
      </button>
      <span className="brd-tip" role="tooltip">{label}</span>
    </div>
  )
}

export default function BoardSidebar({
  board,
  collapsed = false,
  user,
  activeColumnId,
  onJumpToColumn,
  onAddColumn,
  onRefresh,
  onBack,
  onSignOut,
}) {
  const columns = board?.columns ?? []

  return (
    <nav className={`brd-rail brd-glass${collapsed ? ' is-collapsed' : ''}`} aria-label="Board">
      <div className="brd-brand">
        <span className="brd-mark" aria-hidden="true"><i /><i /><i /><i /></span>
        <span className="brd-brand-name">CollabKanban</span>
      </div>

      <button className="brd-back" onClick={onBack} aria-label="Back to dashboard">
        <Icon d={PATH.back} size={16} />
        <span className="brd-navtext">Dashboard</span>
      </button>

      <div className="brd-rail-scroll">
        <div className="brd-navlabel">
          <span className="brd-navlabel-text">Columns</span>
          <span className="brd-navlabel-text">{columns.length}</span>
        </div>

        {columns.length === 0 ? (
          <div className="brd-navempty">No columns yet</div>
        ) : (
          columns.map((col, i) => (
            <Row
              key={col.columnId}
              label={col.name}
              title={col.name}
              active={activeColumnId === col.columnId}
              onClick={() => onJumpToColumn?.(col.columnId)}
            >
              <span className="brd-swatch" style={{ '--c': columnColor(i) }} aria-hidden="true" />
              <span className="brd-navtext">{col.name}</span>
              <span className="brd-navcount">{col.cards?.length ?? 0}</span>
            </Row>
          ))
        )}

        <div className="brd-navlabel"><span className="brd-navlabel-text">Board</span></div>

        <Row label="Add column" onClick={onAddColumn}>
          <Icon d={PATH.plus} />
          <span className="brd-navtext">Add column</span>
        </Row>

        <Row label="Refresh" onClick={onRefresh}>
          <Icon d={PATH.refresh} />
          <span className="brd-navtext">Refresh</span>
        </Row>
      </div>

      <div className="brd-rail-foot">
        <div className="brd-rail-sep" />
        <div className="brd-usercard">
          <Avatar name={user?.name || 'Guest'} size={32} />
          <div className="brd-user-meta">
            <div className="brd-user-name">{user?.name || 'Guest'}</div>
            <div className="brd-user-mail">{user?.email || 'not signed in'}</div>
          </div>
        </div>
        <Row label="Sign out" onClick={onSignOut}>
          <Icon d={PATH.signout} />
          <span className="brd-navtext">Sign out</span>
        </Row>
      </div>
    </nav>
  )
}
