import React, { useRef, useState } from 'react'
import Avatar from './Avatar'
import { StatusIcon, TrashIcon, UnassignedIcon } from './shell/icons'

/** How long the delete button waits for its confirming second click. */
const CONFIRM_MS = 2400

/**
 * Splits `text` on `query` so matches can be wrapped in a highlight.
 * Returns plain text untouched when there's nothing to match.
 */
function highlight(text, query) {
  if (!text) return null
  const q = query.trim()
  if (!q) return text

  const lower = text.toLowerCase()
  const needle = q.toLowerCase()
  const parts = []
  let at = 0

  for (;;) {
    const hit = lower.indexOf(needle, at)
    if (hit === -1) break
    if (hit > at) parts.push(text.slice(at, hit))
    parts.push(
      <mark className="brd-mark-hit" key={`${hit}-${parts.length}`}>
        {text.slice(hit, hit + needle.length)}
      </mark>
    )
    at = hit + needle.length
  }

  if (!parts.length) return text
  if (at < text.length) parts.push(text.slice(at))
  return parts
}

/**
 * TaskCard — one card, after Linear's issue card.
 *
 * Key and assignee along the top, the status mark and title beneath,
 * and the description as a muted line when Display asks for it. Delete
 * is a two-step press that only appears on hover, so a stray click can
 * never lose a card.
 */
export default function TaskCard({
  card,
  columnId,
  status,
  cardKey,
  query = '',
  landed = false,
  showDescription = true,
  onDelete,
  onDragStart,
  onDragEnd,
}) {
  const [dragging, setDragging] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const confirmTimer = useRef(null)

  const handleDragStart = (e) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', JSON.stringify({
      cardId: card.cardId,
      sourceColumnId: columnId,
      cardPosition: card.position,
    }))
    // Deferred so the browser's drag snapshot is taken before the source
    // card fades into its placeholder state.
    setTimeout(() => setDragging(true), 0)
    onDragStart?.(card.cardId, columnId)
  }

  const handleDragEnd = () => {
    setDragging(false)
    onDragEnd?.()
  }

  const handleDeleteClick = (e) => {
    e.stopPropagation()
    if (confirmDelete) {
      clearTimeout(confirmTimer.current)
      onDelete?.(card.cardId, columnId)
      return
    }
    setConfirmDelete(true)
    confirmTimer.current = setTimeout(() => setConfirmDelete(false), CONFIRM_MS)
  }

  const className = [
    'brd-card',
    dragging && 'is-dragging',
    landed && 'is-landed',
    card._isOptimistic && 'is-pending',
    confirmDelete && 'is-confirming',
  ].filter(Boolean).join(' ')

  return (
    <div
      className={className}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onMouseLeave={() => setConfirmDelete(false)}
    >
      <div className="brd-card-top">
        <span className="brd-card-key">{cardKey}</span>
        <button
          className="ui-iconbtn is-sm brd-card-del"
          onClick={handleDeleteClick}
          title={confirmDelete ? 'Click again to delete' : 'Delete card'}
          aria-label={confirmDelete ? 'Confirm delete card' : 'Delete card'}
        >
          <TrashIcon size={13} />
        </button>
        {card.assignedToName
          ? <Avatar name={card.assignedToName} size={18} />
          : (
            <span className="brd-card-unassigned" role="img" aria-label="Unassigned">
              <UnassignedIcon size={16} />
            </span>
          )}
      </div>

      <div className="brd-card-title">
        <StatusIcon status={status} />
        <span>{highlight(card.title, query)}</span>
      </div>

      {showDescription && card.description && (
        <div className="brd-card-desc">{highlight(card.description, query)}</div>
      )}
    </div>
  )
}
