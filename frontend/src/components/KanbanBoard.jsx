import React, { useCallback, useRef, useState } from 'react'
import KanbanColumn from './KanbanColumn'
import CreateColumnModal from './CreateColumnModal'

const PlusIcon = ({ size = 17 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
)

const BoardIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 4.5h18v15H3z" /><path d="M9 4.5v15" /><path d="M15 4.5v15" />
  </svg>
)

/**
 * KanbanBoard — the stage.
 *
 * Holds the transient interaction state that spans columns: which card
 * is currently in flight (so every column can open its gaps) and which
 * card has just landed (so it can play its settle animation once).
 */
export default function KanbanBoard({
  board,
  query = '',
  createColumnOpen,
  onCreateColumnOpen,
  onAddColumn,
  onAddCard,
  onDeleteCard,
  onDeleteColumn,
  onMoveCard,
  registerColumn,
}) {
  const [drag, setDrag] = useState(null)
  const [landedCardId, setLandedCardId] = useState(null)
  const landTimer = useRef(null)

  const columns = board?.columns ?? []

  const handleDragStart = useCallback((cardId, columnId) => {
    setDrag({ cardId, columnId })
  }, [])

  const handleDragEnd = useCallback(() => setDrag(null), [])

  /**
   * Wraps the move so the card can be flagged as "just landed" — the
   * flag is cleared on a timer once the settle animation has played.
   */
  const handleMoveCard = useCallback(async (cardId, sourceColumnId, targetColumnId, targetIndex) => {
    setDrag(null)
    setLandedCardId(cardId)
    clearTimeout(landTimer.current)
    landTimer.current = setTimeout(() => setLandedCardId(null), 700)

    try {
      await onMoveCard?.(cardId, sourceColumnId, targetColumnId, targetIndex)
    } catch {
      setLandedCardId(null)
    }
  }, [onMoveCard])

  if (columns.length === 0) {
    return (
      <div className="brd-center">
        <div className="brd-panel brd-glass">
          <div className="brd-panel-icon"><BoardIcon /></div>
          <div className="brd-panel-title">This board is empty</div>
          <div className="brd-panel-desc">
            Add your first column to start organising work — “To do”, “In progress”, whatever fits.
          </div>
          <button className="brd-btn" onClick={() => onCreateColumnOpen(true)}>
            <PlusIcon size={15} />
            Create first column
          </button>
        </div>

        {createColumnOpen && (
          <CreateColumnModal
            onSubmit={onAddColumn}
            onClose={() => onCreateColumnOpen(false)}
          />
        )}
      </div>
    )
  }

  return (
    <div className="brd-stage">
      <div className="brd-columns">
        {columns.map((col, idx) => (
          <KanbanColumn
            key={col.columnId}
            column={col}
            columnIndex={idx}
            query={query}
            drag={drag}
            landedCardId={landedCardId}
            columnRef={node => registerColumn?.(col.columnId, node)}
            onAddCard={onAddCard}
            onDeleteCard={onDeleteCard}
            onDeleteColumn={onDeleteColumn}
            onMoveCard={handleMoveCard}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          />
        ))}

        <button
          className="brd-addcol"
          style={{ '--d': `${Math.min(columns.length, 8) * 55}ms` }}
          onClick={() => onCreateColumnOpen(true)}
        >
          <PlusIcon />
          New column
        </button>
      </div>

      {createColumnOpen && (
        <CreateColumnModal
          onSubmit={onAddColumn}
          onClose={() => onCreateColumnOpen(false)}
        />
      )}
    </div>
  )
}
