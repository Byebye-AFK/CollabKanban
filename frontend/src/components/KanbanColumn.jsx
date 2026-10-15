import React, { useCallback, useRef, useState } from 'react'
import TaskCard from './TaskCard'
import CreateCardModal from './CreateCardModal'
import { StatusIcon, MoreIcon, PlusIcon, EyeOffIcon, TrashIcon } from './shell/icons'
import { columnStatus, cardKey } from '../api/boardStatus'
import { useDismiss } from '../hooks/useDismiss'

/** Column entrance stagger, and the column count past which it stops growing. */
const STAGGER_MS = 40
const MAX_STAGGER_STEPS = 8

/** The column's ⋯ menu: hide it into the side panel, or delete it. */
function ColumnMenu({ column, onHide, onDelete }) {
  const [isOpen, setOpen] = useState(false)
  const rootRef = useRef(null)
  const close = useCallback(() => setOpen(false), [])
  useDismiss(rootRef, isOpen, close)

  return (
    <div className="brd-col-menu" ref={rootRef}>
      <button
        className={`ui-iconbtn is-sm${isOpen ? ' is-on' : ''}`}
        onClick={() => setOpen(o => !o)}
        aria-label={`Column options for ${column.name}`}
        aria-expanded={isOpen}
      >
        <MoreIcon size={14} />
      </button>
      {isOpen && (
        <div className="ui-menu" role="menu">
          <button role="menuitem" onClick={() => { close(); onHide?.(column.columnId) }}>
            <EyeOffIcon size={14} /> Hide column
          </button>
          <div className="ui-menu-sep" />
          <button
            role="menuitem"
            className="is-danger"
            onClick={() => {
              close()
              if (window.confirm(`Delete "${column.name}" and all cards inside it?`)) {
                onDelete?.(column.columnId)
              }
            }}
          >
            <TrashIcon size={14} /> Delete column
          </button>
        </div>
      )}
    </div>
  )
}

/**
 * KanbanColumn — a header and a stack of cards, with no box of its own.
 *
 * Drop targets are the gaps *between* cards rather than the cards
 * themselves: each gap opens into a slot as the drag passes over it, so
 * the list visibly makes room for the card being carried. Hovering the
 * top or bottom half of a card activates the gap on that side, which
 * keeps the whole list covered without dead zones between the slots.
 */
export default function KanbanColumn({
  column,
  columnIndex,
  boardName,
  query = '',
  drag,
  landedCardId,
  showDescription = true,
  onAddCard,
  onDeleteCard,
  onDeleteColumn,
  onHideColumn,
  onMoveCard,
  onDragStart,
  onDragEnd,
}) {
  const [hoverSlot, setHoverSlot] = useState(null)
  const [showAddCard, setShowAddCard] = useState(false)

  const status = columnStatus(column.name)
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
        className={className}
        style={{ '--d': `${Math.min(columnIndex, MAX_STAGGER_STEPS) * STAGGER_MS}ms` }}
        onDragLeave={handleDragLeave}
        aria-label={column.name}
      >
        <header className="brd-col-head">
          <StatusIcon status={status} />
          <h2 className="brd-col-name" title={column.name}>{column.name}</h2>
          <span className="brd-col-count">
            {q ? `${visible.length}/${cards.length}` : cards.length}
          </span>
          <div className="brd-col-actions">
            <ColumnMenu column={column} onHide={onHideColumn} onDelete={onDeleteColumn} />
            <button
              className="ui-iconbtn is-sm"
              onClick={() => setShowAddCard(true)}
              aria-label={`Add card to ${column.name}`}
              title="Add card"
            >
              <PlusIcon size={14} />
            </button>
          </div>
        </header>

        {/* Empty space below the last card, or in an empty column, drops
            at the end. Only a drag over the list itself counts — events
            bubbling up from a card or slot have already chosen a gap. */}
        <div
          className="brd-cards"
          onDragOver={e => { if (e.target === e.currentTarget) allowDrop(e, cards.length) }}
          onDrop={e => { if (e.target === e.currentTarget) handleDrop(e, cards.length) }}
        >
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
                    status={status}
                    cardKey={cardKey(boardName, card.cardId)}
                    query={query}
                    landed={landedCardId === card.cardId}
                    showDescription={showDescription}
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
            q
              ? <div className="brd-col-empty">No matching cards</div>
              : (
                <button
                  className="brd-col-empty is-action"
                  onClick={() => setShowAddCard(true)}
                  onDragOver={e => allowDrop(e, cards.length)}
                  onDrop={e => handleDrop(e, cards.length)}
                >
                  <PlusIcon size={12} /> Add a card
                </button>
              )
          )}
        </div>
      </section>

      {showAddCard && (
        <CreateCardModal
          columnId={column.columnId}
          columnName={column.name}
          status={status}
          onSubmit={onAddCard}
          onClose={() => setShowAddCard(false)}
        />
      )}
    </>
  )
}
