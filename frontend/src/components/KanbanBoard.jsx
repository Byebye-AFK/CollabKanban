import React, { useState } from 'react'
import KanbanColumn from './KanbanColumn'
import CreateColumnModal from './CreateColumnModal'

const css = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden',
  },
  header: {
    flexShrink: 0,
    padding: '18px 28px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: '1px solid var(--border)',
    background: 'var(--bg-board)',
    zIndex: 10,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
  },
  boardName: {
    fontSize: 18,
    fontWeight: 700,
    color: 'var(--text-primary)',
    letterSpacing: '-0.02em',
  },
  columnCount: {
    fontSize: 12,
    color: 'var(--text-muted)',
    background: 'rgba(255,255,255,0.06)',
    padding: '3px 9px',
    borderRadius: 99,
    fontWeight: 500,
  },
  addColumnBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    padding: '7px 14px',
    borderRadius: 'var(--radius-sm)',
    background: 'var(--accent-light)',
    color: 'var(--accent)',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background var(--transition-fast), color var(--transition-fast)',
    border: '1px solid rgba(124,111,247,0.2)',
    flexShrink: 0,
  },
  scrollArea: {
    flex: 1,
    overflowX: 'auto',
    overflowY: 'hidden',
    padding: '20px 24px 24px',
  },
  columnsRow: {
    display: 'flex',
    gap: 14,
    alignItems: 'flex-start',
    height: '100%',
    width: 'max-content',
  },
  addColumnInline: {
    width: 260,
    minWidth: 260,
    height: 58,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 'var(--radius-lg)',
    border: '1.5px dashed rgba(255,255,255,0.10)',
    color: 'var(--text-muted)',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    flexShrink: 0,
    transition: 'border-color var(--transition-fast), color var(--transition-fast), background var(--transition-fast)',
    userSelect: 'none',
    alignSelf: 'flex-start',
    marginTop: 0,
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: '60px 20px',
    color: 'var(--text-muted)',
    textAlign: 'center',
  },
  emptyIcon: {
    fontSize: 40,
    opacity: 0.3,
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: 'var(--text-secondary)',
  },
  emptyDesc: {
    fontSize: 13,
    color: 'var(--text-muted)',
    maxWidth: 280,
  },
  emptyBtn: {
    marginTop: 8,
    padding: '9px 18px',
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

export default function KanbanBoard({
  board,
  onAddColumn,
  onAddCard,
  onDeleteCard,
  onDeleteColumn,
  onMoveCard,
}) {
  const [showCreateColumn, setShowCreateColumn] = useState(false)
  const [addColBtnHover, setAddColBtnHover] = useState(false)
  const [inlineHover, setInlineHover] = useState(false)

  const columns = board?.columns ?? []

  const handleAddColumn = async (name) => {
    await onAddColumn({
      boardId: board.boardId,
      name: name,
    })
  }

  return (
    <div style={css.wrapper}>
      <div style={css.header}>
        <div style={css.headerLeft}>
          <h1 style={css.boardName}>{board?.name ?? 'Board'}</h1>

          {columns.length > 0 && (
            <span style={css.columnCount}>
              {columns.length} {columns.length === 1 ? 'column' : 'columns'}
            </span>
          )}
        </div>

        <button
          style={{
            ...css.addColumnBtn,
            ...(addColBtnHover
              ? {
                  background: 'var(--accent)',
                  color: '#fff',
                }
              : {}),
          }}
          onMouseEnter={() => setAddColBtnHover(true)}
          onMouseLeave={() => setAddColBtnHover(false)}
          onClick={() => setShowCreateColumn(true)}
        >
          <span style={{ fontSize: 16, lineHeight: 1 }}>+</span>
          Add column
        </button>
      </div>

      <div style={css.scrollArea}>
        {columns.length === 0 ? (
          <div style={css.emptyState}>
            <div style={css.emptyIcon}>⬛</div>

            <div style={css.emptyTitle}>
              No columns yet
            </div>

            <div style={css.emptyDesc}>
              Create your first column to start organising work on this board.
            </div>

            <button
              style={css.emptyBtn}
              onClick={() => setShowCreateColumn(true)}
              onMouseEnter={e =>
                e.currentTarget.style.background =
                  'var(--accent-hover)'
              }
              onMouseLeave={e =>
                e.currentTarget.style.background =
                  'var(--accent)'
              }
            >
              Create first column
            </button>
          </div>
        ) : (
          <div style={css.columnsRow}>
            {columns.map((col, idx) => (
              <KanbanColumn
                key={col.columnId}
                column={col}
                columnIndex={idx}
                onAddCard={onAddCard}
                onDeleteCard={onDeleteCard}
                onDeleteColumn={onDeleteColumn}
                onMoveCard={onMoveCard}
              />
            ))}

            <div
              style={{
                ...css.addColumnInline,
                ...(inlineHover
                  ? {
                      borderColor: 'var(--accent)',
                      color: 'var(--accent)',
                      background: 'var(--accent-light)',
                    }
                  : {}),
              }}
              onMouseEnter={() => setInlineHover(true)}
              onMouseLeave={() => setInlineHover(false)}
              onClick={() => setShowCreateColumn(true)}
              role="button"
              aria-label="Add column"
            >
              <span style={{ fontSize: 18 }}>+</span>
              New column
            </div>
          </div>
        )}
      </div>

      {showCreateColumn && (
        <CreateColumnModal
          onSubmit={handleAddColumn}
          onClose={() => setShowCreateColumn(false)}
        />
      )}
    </div>
  )
}