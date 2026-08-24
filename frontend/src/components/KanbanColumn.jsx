import React, { useState } from 'react'
import TaskCard from './TaskCard'
import CreateCardModal from './CreateCardModal'
import { COLUMN_COLORS } from './Avatar'

/**
 * Returns a colour from the COLUMN_COLORS spectrum by index.
 * Cycles through the palette so there's always a colour,
 * regardless of how many columns exist.
 */
export function columnColor(index) {
  return COLUMN_COLORS[index % COLUMN_COLORS.length]
}

const PlusIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
)

const CloseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.2" strokeLinecap="round">
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
)

/**
 * KanbanColumn — a frosted pane holding frosted cards.
 *
 * Drop targets are the gaps *between* cards rather than the cards
 * themselves: each gap grows into a glowing slot as the drag passes
 * over it, so the list visibly opens a space for the card being
 * carried. Hovering the top or bottom half of a card activates the gap
 * on that side, which keeps the whole list covered without leaving dead
 * zones between the slots.
 */
export default function KanbanColumn({
  column,
  columnIndex,
  query = '',
  drag,
  landedCardId,
  columnRef,
  onAddCard,
  onDeleteCard,
  onDeleteColumn,
  onMoveCard,
  onDragStart,
  onDragEnd,
}) {
  const [hoverSlot, setHoverSlot] = useState(null)
  const [showAddCard, setShowAddCard] = useState(false)

  const color = columnColor(columnIndex)
  const cards = column.cards ?? []

  // Cards are filtered for display only — slot indices stay anchored to
  // the real list, so a move made while searching still lands correctly.
  const q = query.trim().toLowerCase()
  const visible = q
    ? cards.filter(c =>
        (c.title ?? '').toLowerCase().includes(q) ||
        (c.description ?? '').toLowerCase().includes(q))
    : cards
  const visibleIds = new Set(visible.map(c => c.cardId))

  const isDraggingAny = Boolean(drag)
  const fromThisColumn = drag?.columnId === column.columnId
  const dragIndex = fromThisColumn
    ? cards.findIndex(c => c.cardId === drag.cardId)
    : -1

  /**
   * A slot immediately above or below the card being dragged would put
   * it back where it started, so it never lights up.
   */
  const isNoop = (slot) =>
    fromThisColumn && dragIndex >= 0 && (slot === dragIndex || slot === dragIndex + 1)

  const allowDrop = (e, slot) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setHoverSlot(isNoop(slot) ? null : slot)
  }

  /** Top half of a card targets the gap above it, bottom half the gap below. */
  const allowDropOnCard = (e, index) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const below = e.clientY > rect.top + rect.height / 2
    allowDrop(e, below ? index + 1 : index)
  }

  const handleDragLeave = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) setHoverSlot(null)
  }

  const handleDrop = (e, slot) => {
    e.preventDefault()
    e.stopPropagation()
    setHoverSlot(null)

    let data
    try {
      data = JSON.parse(e.dataTransfer.getData('text/plain'))
    } catch {
      return
    }
    if (!data?.cardId) return

    const sameColumn = data.sourceColumnId === column.columnId

    // For a same-column move the card is pulled out of the list before
    // being reinserted, so every slot below it shifts up by one.
    const sourceIndex = sameColumn
      ? cards.findIndex(c => c.cardId === data.cardId)
      : -1
    const target = sameColumn && sourceIndex >= 0 && slot > sourceIndex ? slot - 1 : slot

    if (sameColumn && target === sourceIndex) return

    onMoveCard?.(data.cardId, data.sourceColumnId, column.columnId, target)
  }

  // Returned as plain JSX rather than a nested component, so the slots
  // keep their DOM identity across renders and their height transition
  // actually plays instead of being remounted mid-animation.
  const slot = (index) => (
    <div
      key={`slot-${index}`}
      className={`brd-slot${hoverSlot === index ? ' is-active' : ''}`}
      onDragOver={e => allowDrop(e, index)}
      onDrop={e => handleDrop(e, index)}
      aria-hidden="true"
    />
  )

  const className = [
    'brd-col',
    hoverSlot !== null && 'is-over',
    isDraggingAny && 'is-dragging-any',
  ].filter(Boolean).join(' ')

  return (
    <>
      <section
        ref={columnRef}
        className={className}
        style={{ '--c': color, '--d': `${Math.min(columnIndex, 8) * 55}ms` }}
        onDragLeave={handleDragLeave}
        aria-label={column.name}
      >
        <header className="brd-col-head">
          <span className="brd-col-bar" aria-hidden="true" />
          <h2 className="brd-col-name" title={column.name}>{column.name}</h2>
          <span className="brd-col-count">
            {q ? `${visible.length}/${cards.length}` : cards.length}
          </span>
          <button
            className="brd-col-del"
            onClick={() => {
              if (window.confirm(`Delete "${column.name}" and all cards inside it?`)) {
                onDeleteColumn?.(column.columnId)
              }
            }}
            title="Delete column"
            aria-label={`Delete column ${column.name}`}
          >
            <CloseIcon />
          </button>
        </header>

        <div className="brd-col-rule" />

        <div className="brd-cards">
          {slot(0)}

          {cards.map((card, index) => {
            if (q && !visibleIds.has(card.cardId)) return null
            return (
              <React.Fragment key={card.cardId}>
                <div
                  onDragOver={e => allowDropOnCard(e, index)}
                  onDrop={e => handleDrop(e, hoverSlot ?? index)}
                >
                  <TaskCard
                    card={card}
                    columnId={column.columnId}
                    color={color}
                    query={query}
                    landed={landedCardId === card.cardId}
                    onDelete={onDeleteCard}
                    onDragStart={onDragStart}
                    onDragEnd={onDragEnd}
                  />
                </div>
                {slot(index + 1)}
              </React.Fragment>
            )
          })}

          {visible.length === 0 && (
            <div className="brd-col-empty">
              {q ? 'No matching cards' : 'Nothing here yet'}
            </div>
          )}
        </div>

        <footer className="brd-col-foot">
          <button className="brd-addcard" onClick={() => setShowAddCard(true)}>
            <PlusIcon />
            Add card
          </button>
        </footer>
      </section>

      {showAddCard && (
        <CreateCardModal
          columnId={column.columnId}
          columnName={column.name}
          columnColor={color}
          onSubmit={onAddCard}
          onClose={() => setShowAddCard(false)}
        />
      )}
    </>
  )
}
