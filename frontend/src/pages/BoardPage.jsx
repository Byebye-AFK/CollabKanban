import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useBoard } from '../hooks/useBoard'
import { useBoardTeam } from '../hooks/useBoardTeam'
import AppShell from '../components/shell/AppShell'
import PageHeader from '../components/shell/PageHeader'
import SearchField from '../components/shell/SearchField'
import { BoardIcon, PlusIcon, RefreshIcon, WarnIcon } from '../components/shell/icons'
import KanbanBoard from '../components/KanbanBoard'
import BoardMembers from '../components/board/BoardMembers'
import DisplayMenu from '../components/board/DisplayMenu'
import AddTeamMembersModal from '../components/teams/AddTeamMembersModal'
import { getCachedWorkspaces } from '../api/dashboardApi'
import { BOARD_VIEWS, filterColumnsByView } from '../api/boardStatus'
import { getHidden, toggleHidden, partitionColumns, getDisplay, setDisplay } from '../api/boardPrefsApi'
import { useRailNavigate } from '../hooks/useRailNavigate'
import '../styles/board.css'

/**
 * BoardPage — one board, laid out like a Linear project board.
 *
 * Breadcrumb header, a row of view tabs (All cards / Active / Backlog),
 * a Filter / Display toolbar, then the columns with a "Hidden columns"
 * panel at the right. Views, hidden columns and Display options are
 * this browser's preferences (boardPrefsApi); the board itself comes
 * from useBoard, live over the socket.
 */

/** Matches across every card on the board, for the toolbar's count. */
function countMatches(columns, query) {
  const q = query.trim().toLowerCase()
  if (!q) return null
  const hits = columns.reduce((n, col) =>
    n + (col.cards ?? []).filter(c =>
      (c.title ?? '').toLowerCase().includes(q) ||
      (c.description ?? '').toLowerCase().includes(q)
    ).length, 0)
  return `${hits} ${hits === 1 ? 'match' : 'matches'}`
}

export default function BoardPage({
  boardId,
  boardName,
  workspace,
  user,
  onBack,
  backLabel,
  onOpenBoard,
  onNavigate,
  onSignOut,
}) {
  const {
    board,
    loading,
    error,
    isLive,
    loadBoard,
    connectBoardSocket,
    disconnectBoardSocket,
    addColumn,
    addCard,
    moveCard,
    deleteCard,
    deleteColumn,
  } = useBoard()

  // The board only carries its team's id; the team itself comes from the
  // workspace the board was opened in.
  const { team, canManage, addMembers } = useBoardTeam(workspace, board?.teamId)
  const [addingPeople, setAddingPeople] = useState(false)

  const [query, setQuery] = useState('')
  const [collapsed, setCollapsed] = useState(false)
  const [createColumnOpen, setCreateColumnOpen] = useState(false)
  const [view, setView] = useState('all')
  const [hiddenIds, setHiddenIds] = useState(() => getHidden(boardId))
  const [display, setDisplayState] = useState(getDisplay)

  useEffect(() => {
    if (!boardId) return undefined
    loadBoard(boardId)
    connectBoardSocket(boardId)
    setHiddenIds(getHidden(boardId))
    return () => disconnectBoardSocket()
  }, [boardId, loadBoard, connectBoardSocket, disconnectBoardSocket])

  // The modal collects a name; the hook wants the board it belongs to.
  const handleAddColumn = useCallback(
    (name) => addColumn(board?.boardId ?? boardId, name),
    [addColumn, board, boardId]
  )

  const toggleColumn = useCallback(
    (columnId) => setHiddenIds(toggleHidden(boardId, columnId)),
    [boardId]
  )

  const changeDisplay = useCallback((change) => setDisplayState(setDisplay(change)), [])

  // No sidebar entry is this page, so every routable one leaves it.
  const { navigate, toast } = useRailNavigate(null, onNavigate)

  const allColumns = useMemo(() => board?.columns ?? [], [board])
  const { shown, hidden } = useMemo(() => partitionColumns(allColumns, hiddenIds), [allColumns, hiddenIds])

  const columns = useMemo(() => {
    const inView = filterColumnsByView(shown, view)
    return display.showEmptyColumns ? inView : inView.filter(c => (c.cards ?? []).length > 0)
  }, [shown, view, display.showEmptyColumns])

  const matchLabel = useMemo(() => countMatches(allColumns, query), [allColumns, query])

  const title = board?.name || boardName || (boardId ? `Board ${boardId}` : 'Board')

  const crumbs = [
    { label: workspace?.name || 'Boards', onClick: onBack },
    title,
  ]

  const body = (() => {
    if (loading && !board) {
      return <div className="ui-state"><div className="ui-spinner" /><span>Loading board…</span></div>
    }
    if (error) {
      return (
        <div className="ui-state">
          <span className="ui-state-icon is-warn"><WarnIcon size={18} /></span>
          <span className="ui-state-title">Couldn't load this board</span>
          <span className="ui-state-desc">{error}</span>
          <button className="ui-btn" onClick={() => loadBoard(boardId)}>Try again</button>
        </div>
      )
    }
    if (!board) return null
    return (
      <KanbanBoard
        board={board}
        columns={columns}
        hiddenColumns={hidden}
        query={query}
        showDescriptions={display.showDescriptions}
        createColumnOpen={createColumnOpen}
        onCreateColumnOpen={setCreateColumnOpen}
        onAddColumn={handleAddColumn}
        onAddCard={addCard}
        onDeleteCard={deleteCard}
        onDeleteColumn={deleteColumn}
        onHideColumn={toggleColumn}
        onShowColumn={toggleColumn}
        onMoveCard={moveCard}
      />
    )
  })()

  return (
    <AppShell
      active="boards"
      collapsed={collapsed}
      user={user}
      workspaces={getCachedWorkspaces()}
      activeBoardId={boardId}
      onNavigate={navigate}
      onOpenBoard={onOpenBoard}
      onSignOut={onSignOut}
    >
      <PageHeader crumbs={crumbs} collapsed={collapsed} onToggleCollapse={() => setCollapsed(c => !c)}>
        {/* Only shown when live updates are off. A board that has quietly
            stopped updating looks identical to a quiet board. */}
        {!isLive && (
          <span
            className="brd-live-off"
            role="status"
            title="Reconnecting — other people's changes may not appear yet"
          >
            <span className="brd-live-dot" aria-hidden="true" />
            Offline
          </span>
        )}
        {team && (
          <BoardMembers
            teamName={team.name}
            members={team.members}
            onAddPeople={canManage ? () => setAddingPeople(true) : undefined}
          />
        )}
      </PageHeader>

      <div className="app-tabs" role="tablist" aria-label="Board views">
        <span className="app-tab is-static" title={backLabel}>
          <BoardIcon size={14} />
          {title}
        </span>
        {BOARD_VIEWS.map(v => (
          <button
            key={v.id}
            role="tab"
            aria-selected={view === v.id}
            className={`app-tab${view === v.id ? ' is-on' : ''}`}
            onClick={() => setView(v.id)}
          >
            {v.label}
          </button>
        ))}
      </div>

      <div className="app-toolbar">
        <SearchField
          value={query}
          onChange={setQuery}
          placeholder="Filter cards…"
          label="Search cards"
          hotkey
          className="brd-filter"
        />
        {matchLabel && <span className="app-meta">{matchLabel}</span>}

        <div className="app-toolbar-right">
          <button className="ui-iconbtn" onClick={() => loadBoard(boardId)} aria-label="Refresh" title="Refresh">
            <RefreshIcon size={15} />
          </button>
          <DisplayMenu display={display} onChange={changeDisplay} />
          <button className="ui-btn" onClick={() => setCreateColumnOpen(true)}>
            <PlusIcon size={12} />
            Column
          </button>
        </div>
      </div>

      {body}

      {addingPeople && team && (
        <AddTeamMembersModal
          team={team}
          onSubmit={addMembers}
          onClose={() => setAddingPeople(false)}
        />
      )}

      {toast && <div className="ui-toast" role="status">{toast}</div>}
    </AppShell>
  )
}
