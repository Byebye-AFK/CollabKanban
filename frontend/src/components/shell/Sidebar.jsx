import React, { useState } from 'react'
import Avatar from '../Avatar'
import { Icon, GLYPHS, ChevronDown, BoardIcon } from './icons'
import { colorFor } from './palette'

/**
 * The app sidebar, after Linear's.
 *
 * A short list of pages, a "Workspace" group of library views, and a
 * "Your workspaces" tree whose workspaces open to list their boards —
 * so a board is one click from anywhere, including another board.
 *
 * Only the workspace holding the open board starts expanded. The rest
 * stay folded so a long list of workspaces reads as a list, not a wall.
 */
export const NAV = [
  { id: 'dashboard',  label: 'Dashboard',  group: null },
  { id: 'starred',    label: 'Starred',    group: null },
  { id: 'boards',     label: 'Boards',     group: 'Workspace' },
  { id: 'teams',      label: 'Teams',      group: 'Workspace' },
  { id: 'graph',      label: 'Graph view', group: 'Workspace' },
  { id: 'workspaces', label: 'Workspaces', group: 'Workspace' },
]

const SETTINGS = { id: 'settings', label: 'Settings' }

function NavItem({ item, active, onClick, children }) {
  return (
    <button
      className={`app-nav-item${active ? ' is-active' : ''}`}
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      aria-label={item.label}
      title={item.label}
    >
      <Icon paths={GLYPHS[item.id]} />
      <span className="app-nav-text">{item.label}</span>
      {children}
    </button>
  )
}

/** A folding section heading — "Workspace ▾", "Your workspaces ▾". */
function Group({ label, children }) {
  const [isOpen, setOpen] = useState(true)
  return (
    <div className="app-nav-group">
      <button
        className={`app-nav-heading${isOpen ? ' is-open' : ''}`}
        onClick={() => setOpen(o => !o)}
        aria-expanded={isOpen}
      >
        {label}
        <ChevronDown size={10} />
      </button>
      {isOpen && <div className="app-nav-list">{children}</div>}
    </div>
  )
}

function WorkspaceTree({ workspace, isInitiallyOpen, activeBoardId, onOpenBoard }) {
  const [isOpen, setOpen] = useState(isInitiallyOpen)
  const boards = workspace.boards ?? []

  return (
    <div className="app-tree">
      <button
        className="app-nav-item app-tree-head"
        onClick={() => setOpen(o => !o)}
        aria-expanded={isOpen}
        title={workspace.name}
      >
        <span className="app-ws-mark" style={{ '--c': colorFor(workspace.name) }} aria-hidden="true">
          {workspace.name.charAt(0).toUpperCase()}
        </span>
        <span className="app-nav-text">{workspace.name}</span>
        <ChevronDown size={10} className={`app-tree-chevron${isOpen ? ' is-open' : ''}`} />
      </button>

      {isOpen && (
        <div className="app-tree-body">
          {boards.length === 0 && <div className="app-tree-empty">No boards yet</div>}
          {boards.map(board => (
            <button
              key={board.boardId}
              className={`app-nav-item app-tree-item${board.boardId === activeBoardId ? ' is-active' : ''}`}
              onClick={() => onOpenBoard?.(board.boardId, workspace, board.name)}
              aria-current={board.boardId === activeBoardId ? 'page' : undefined}
              title={board.name}
            >
              <BoardIcon size={14} />
              <span className="app-nav-text">{board.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Sidebar({
  active = 'dashboard',
  collapsed = false,
  user,
  workspaces = [],
  activeBoardId = null,
  onNavigate,
  onOpenBoard,
  onSignOut,
}) {
  const top = NAV.filter(item => item.group === null)
  const library = NAV.filter(item => item.group === 'Workspace')

  return (
    <nav
      className={`app-sidebar${collapsed ? ' is-collapsed' : ''}`}
      aria-label="Primary"
      aria-hidden={collapsed || undefined}
      inert={collapsed ? '' : undefined}
    >
      <div className="app-brand">
        <span className="app-brand-mark" aria-hidden="true"><i /><i /><i /></span>
        <span className="app-brand-name">CollabKanban</span>
      </div>

      <div className="app-sidebar-scroll">
        <div className="app-nav-list">
          {top.map(item => (
            <NavItem key={item.id} item={item} active={active === item.id} onClick={() => onNavigate?.(item.id)} />
          ))}
        </div>

        <Group label="Workspace">
          {library.map(item => (
            <NavItem key={item.id} item={item} active={active === item.id} onClick={() => onNavigate?.(item.id)} />
          ))}
        </Group>

        {workspaces.length > 0 && (
          <Group label="Your workspaces">
            {workspaces.map(ws => (
              <WorkspaceTree
                key={ws.workspaceId}
                workspace={ws}
                isInitiallyOpen={(ws.boards ?? []).some(b => b.boardId === activeBoardId)}
                activeBoardId={activeBoardId}
                onOpenBoard={onOpenBoard}
              />
            ))}
          </Group>
        )}
      </div>

      <div className="app-sidebar-foot">
        <NavItem item={SETTINGS} active={false} onClick={() => onNavigate?.(SETTINGS.id)} />
        <div className="app-user">
          <Avatar name={user?.name || 'Guest'} size={22} decorative />
          <span className="app-user-text">
            <span className="app-user-name">{user?.name || 'Guest'}</span>
            <span className="app-user-mail">{user?.email || 'not signed in'}</span>
          </span>
          <button className="ui-iconbtn is-sm" onClick={onSignOut} aria-label="Sign out" title="Sign out">
            <Icon paths={GLYPHS.signout} size={14} />
          </button>
        </div>
      </div>
    </nav>
  )
}
