import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useBoard } from '../hooks/useBoard'
import KanbanBoard from '../components/KanbanBoard'
import BoardSidebar from '../components/board/BoardSidebar'
import BoardTopbar from '../components/board/BoardTopbar'
import './BoardPage.css'

/**
 * BoardPage — the board workspace.
 *
 * Frosted panes over a drifting aurora, sharing the dashboard's
 * material and typography. The rail is on the left, the search bar
 * across the top, and the board itself is centred in what's left.
 * All styling lives in BoardPage.css under the .brd scope.
 */
const Aurora = () => (
  <div className="brd-aurora" aria-hidden="true">
    <i className="brd-orb-a" style={{ '--dx': '6%',  '--dy': '5%',  '--dur': '28s' }} />
    <i className="brd-orb-b" style={{ '--dx': '-5%', '--dy': '7%',  '--dur': '32s', '--delay': '-6s' }} />
    <i className="brd-orb-c" style={{ '--dx': '4%',  '--dy': '-6%', '--dur': '26s', '--delay': '-12s' }} />
    <i className="brd-orb-d" style={{ '--dx': '-7%', '--dy': '-4%', '--dur': '34s', '--delay': '-3s' }} />
  </div>
)

const WarnIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3.6 21 19H3z" /><path d="M12 9.5v4.5" /><path d="M12 17h.01" />
  </svg>
)

export default function BoardPage({
  boardId,
  boardName,
  workspace,
  user,
  onBack,
  onSignOut,
}) {
  const {
    board,
    loading,
    error,
    loadBoard,
    addColumn,
    addCard,
    moveCard,
    deleteCard,
    deleteColumn,
  } = useBoard()

  const [query, setQuery] = useState('')
  const [collapsed, setCollapsed] = useState(false)
  const [createColumnOpen, setCreateColumnOpen] = useState(false)
  const [activeColumnId, setActiveColumnId] = useState(null)

  const columnNodes = useRef(new Map())

  useEffect(() => {
    if (boardId) loadBoard(boardId)
  }, [boardId, loadBoard])

  const registerColumn = useCallback((columnId, node) => {
    if (node) columnNodes.current.set(columnId, node)
    else columnNodes.current.delete(columnId)
  }, [])

  const jumpToColumn = useCallback((columnId) => {
    setActiveColumnId(columnId)
    columnNodes.current.get(columnId)?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    })
  }, [])

  // The modal collects a name; the hook wants the board it belongs to.
  const handleAddColumn = useCallback(
    (name) => addColumn(board?.boardId ?? boardId, name),
    [addColumn, board, boardId]
  )

  const matchLabel = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q || !board) return null
    const hits = (board.columns ?? []).reduce((n, col) =>
      n + (col.cards ?? []).filter(c =>
        (c.title ?? '').toLowerCase().includes(q) ||
        (c.description ?? '').toLowerCase().includes(q)
      ).length, 0)
    return `${hits} ${hits === 1 ? 'match' : 'matches'}`
  }, [query, board])

  const title = board?.name || boardName || (boardId ? `Board ${boardId}` : 'Board')

  const shell = (children) => (
    <div className="brd">
      <Aurora />
      <BoardSidebar
        board={board}
        collapsed={collapsed}
        user={user}
        activeColumnId={activeColumnId}
        onJumpToColumn={jumpToColumn}
        onAddColumn={() => setCreateColumnOpen(true)}
        onRefresh={() => loadBoard(boardId)}
        onBack={onBack}
        onSignOut={onSignOut}
      />
      <div className="brd-main">
        <BoardTopbar
          boardName={title}
          workspaceName={workspace?.name}
          query={query}
          onQueryChange={setQuery}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(c => !c)}
          onAddColumn={() => setCreateColumnOpen(true)}
          matchLabel={matchLabel}
        />
        {children}
      </div>
    </div>
  )

  if (loading && !board) {
    return shell(
      <div className="brd-center">
        <div className="brd-panel brd-glass">
          <div className="brd-spinner" />
          <div className="brd-panel-title">Loading board…</div>
        </div>
      </div>
    )
  }

  if (error) {
    return shell(
      <div className="brd-center">
        <div className="brd-panel brd-glass">
          <div className="brd-panel-icon is-warn"><WarnIcon /></div>
          <div className="brd-panel-title">Couldn't load this board</div>
          <div className="brd-panel-desc">{error}</div>
          <button className="brd-btn" onClick={() => loadBoard(boardId)}>Try again</button>
        </div>
      </div>
    )
  }

  if (!board) return shell(null)

  return shell(
    <KanbanBoard
      board={board}
      query={query}
      createColumnOpen={createColumnOpen}
      onCreateColumnOpen={setCreateColumnOpen}
      onAddColumn={handleAddColumn}
      onAddCard={addCard}
      onDeleteCard={deleteCard}
      onDeleteColumn={deleteColumn}
      onMoveCard={moveCard}
      registerColumn={registerColumn}
    />
  )
}
