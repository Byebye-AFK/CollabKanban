import React, { useCallback, useRef, useState } from 'react'
import KanbanColumn from './KanbanColumn'
import CreateColumnModal from './CreateColumnModal'
import HiddenColumns from './board/HiddenColumns'
import { BoardIcon, PlusIcon } from './shell/icons'

/** How long a dropped card keeps its "just landed" settle animation. */
const LANDED_MS = 700

/**
 * KanbanBoard — the stage.
 *
 * Lays out the columns the page chose to show, with the hidden ones in
 * a panel at the right, and holds the interaction state that spans
 * columns: which card is in flight (so every column opens its gaps) and
 * which card just landed (so it plays its settle animation once).
 */
export default function KanbanBoard({
  board,
  columns = [],
  hiddenColumns = [],
  query = '',
  showDescriptions = true,
  createColumnOpen,
  onCreateColumnOpen,
  onAddColumn,
  onAddCard,
  onDeleteCard,
  onDeleteColumn,
  onHideColumn,
  onShowColumn,
  onMoveCard,
}) {
  const [drag, setDrag] = useState(null)
  const [landedCardId, setLandedCardId] = useState(null)
  const landTimer = useRef(null)

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
    landTimer.current = setTimeout(() => setLandedCardId(null), LANDED_MS)

    try {
      await onMoveCard?.(cardId, sourceColumnId, targetColumnId, targetIndex)
    } catch {
      setLandedCardId(null)
    }
  }, [onMoveCard])

  const createModal = createColumnOpen && (
    <CreateColumnModal onSubmit={onAddColumn} onClose={() => onCreateColumnOpen(false)} />
  )

  if ((board?.columns ?? []).length === 0) {
    return (
      <div className="ui-state brd-stage-empty">
        <span className="ui-state-icon"><BoardIcon size={18} /></span>
        <span className="ui-state-title">This board is empty</span>
        <span className="ui-state-desc">
          Add your first column to start organising work — “Todo”, “In Progress”, whatever fits.
        </span>
        <button className="ui-btn is-primary" onClick={() => onCreateColumnOpen(true)}>
          <PlusIcon size={12} />
          Create first column
        </button>
        {createModal}
      </div>
    )
  }

  return (
    <div className="brd-stage">
      <div className="brd-columns">
        {columns.length === 0 && (
          <div className="ui-state brd-view-empty">
            <span className="ui-state-title">No columns in this view</span>
            <span className="ui-state-desc">Switch to All cards, or show a hidden column.</span>
          </div>
        )}

        {columns.map((col, idx) => (
          <KanbanColumn
            key={col.columnId}
            column={col}
            columnIndex={idx}
            boardName={board.name}
            query={query}
            drag={drag}
            landedCardId={landedCardId}
            showDescription={showDescriptions}
            onAddCard={onAddCard}
            onDeleteCard={onDeleteCard}
            onDeleteColumn={onDeleteColumn}
            onHideColumn={onHideColumn}
            onMoveCard={handleMoveCard}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          />
        ))}

        <HiddenColumns columns={hiddenColumns} onShow={onShowColumn} onMoveCard={handleMoveCard} />
      </div>

      {createModal}
    </div>
  )
}
