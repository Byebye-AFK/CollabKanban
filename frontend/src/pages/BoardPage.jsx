import React, { useEffect } from 'react'
import { useBoard } from '../hooks/useBoard'
import KanbanBoard from '../components/KanbanBoard'

const css = {
  page: {
    height: '100%',
    background: 'var(--bg-board)',
    display: 'flex',
    flexDirection: 'column',
  },
  loading: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    gap: 14,
    color: 'var(--text-muted)',
  },
  spinner: {
    width: 28,
    height: 28,
    border: '2.5px solid rgba(255,255,255,0.08)',
    borderTop: '2.5px solid var(--accent)',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: {
    fontSize: 14,
    color: 'var(--text-muted)',
    fontWeight: 500,
  },
  error: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    gap: 14,
    color: 'var(--text-primary)',
    padding: 40,
    textAlign: 'center',
  },
  errorIcon: {
    fontSize: 36,
    opacity: 0.5,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: 'var(--danger)',
  },
  errorMsg: {
    fontSize: 13,
    color: 'var(--text-muted)',
    maxWidth: 380,
    lineHeight: 1.6,
  },
  retryBtn: {
    marginTop: 6,
    padding: '8px 18px',
    borderRadius: 'var(--radius-sm)',
    background: 'var(--accent)',
    color: '#fff',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    border: 'none',
    transition: 'background var(--transition-fast)',
  },
}

/**
 * BoardPage
 * Accepts a boardId prop from App.jsx, loads the board via useBoard,
 * and delegates all UI to KanbanBoard.
 */
export default function BoardPage({ boardId }) {
  const {
    board,
    loading,
    error,
    loadBoard,
    addColumn,
    addCard,
    moveCard,
    deleteCard,
    deleteColumn
  } = useBoard()

  useEffect(() => {
    if (boardId) loadBoard(boardId)
  }, [boardId, loadBoard])

  if (loading) {
    return (
      <div style={css.page}>
        <div style={css.loading}>
          <div style={css.spinner} />
          <span style={css.loadingText}>Loading board…</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={css.page}>
        <div style={css.error}>
          <div style={css.errorIcon}>⚠️</div>
          <div style={css.errorTitle}>Couldn't load board</div>
          <div style={css.errorMsg}>{error}</div>
          <button
            style={css.retryBtn}
            onClick={() => loadBoard(boardId)}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--accent)'}
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  if (!board) return null

  return (
    <div style={css.page}>
      <KanbanBoard
        board={board}
        onAddColumn={addColumn}
        onAddCard={addCard}
        onDeleteCard={deleteCard}
        onMoveCard={moveCard}
        onDeleteColumn={deleteColumn}
      />
    </div>
  )
}
