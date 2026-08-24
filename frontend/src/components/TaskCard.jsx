import React, { useRef, useState } from 'react'
import Avatar from './Avatar'

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

const TrashIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 7h16" /><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7" />
    <path d="M6.5 7l.8 11.2A2 2 0 0 0 9.3 20h5.4a2 2 0 0 0 2-1.8L17.5 7" />
  </svg>
)

/**
 * TaskCard — a pane of frosted glass resting on the column glass.
 *
 * The browser's own drag snapshot renders `backdrop-filter` as nothing,
 * which would make a glass card vanish the moment it was picked up, so
 * the drag image is composed by hand from an opaque clone instead.
 */
export default function TaskCard({
  card,
  columnId,
  color,
  query = '',
  landed = false,
  onDelete,
  onDragStart,
  onDragEnd,
}) {
  const [dragging, setDragging] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const nodeRef = useRef(null)
  const confirmTimer = useRef(null)

  const handleDragStart = (e) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', JSON.stringify({
      cardId: card.cardId,
      sourceColumnId: columnId,
      cardPosition: card.position,
    }))

    const node = nodeRef.current
    if (node) {
      const rect = node.getBoundingClientRect()
      const ghost = node.cloneNode(true)
      ghost.classList.add('brd-ghost')
      ghost.style.width = `${rect.width}px`
      // Mounted inside the .brd root rather than on <body> so it keeps
      // inheriting the board's font and colour tokens. It's fixed and
      // parked off-screen, so it costs the layout nothing.
      ;(node.closest('.brd') || document.body).appendChild(ghost)
      e.dataTransfer.setDragImage(ghost, e.clientX - rect.left, e.clientY - rect.top)
      // The snapshot is taken synchronously, so the clone only has to
      // survive to the end of this frame.
      requestAnimationFrame(() => ghost.remove())
    }

    // Deferred so the drag snapshot is captured before the source card
    // fades into its placeholder state.
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
    confirmTimer.current = setTimeout(() => setConfirmDelete(false), 2400)
  }

  const className = [
    'brd-card',
    dragging && 'is-dragging',
    landed && 'is-landed',
    card._isOptimistic && 'is-pending',
  ].filter(Boolean).join(' ')

  return (
    <div
      ref={nodeRef}
      className={className}
      style={{ '--c': color }}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onMouseLeave={() => setConfirmDelete(false)}
    >
      <div className="brd-card-title">{highlight(card.title, query)}</div>

      {card.description && (
        <div className="brd-card-desc">{highlight(card.description, query)}</div>
      )}

      <div className="brd-card-foot">
        {card.assignedToName
          ? <Avatar name={card.assignedToName} size={24} />
          : <span className="brd-card-unassigned" aria-label="Unassigned" />}

        <button
          className={`brd-card-del${confirmDelete ? ' is-confirming' : ''}`}
          onClick={handleDeleteClick}
          title={confirmDelete ? 'Click again to delete' : 'Delete card'}
          aria-label={confirmDelete ? 'Confirm delete card' : 'Delete card'}
        >
          <TrashIcon />
        </button>
      </div>
    </div>
  )
}
