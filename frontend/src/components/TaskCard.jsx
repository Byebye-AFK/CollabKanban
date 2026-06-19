import React, { useState, useRef } from 'react'
import Avatar from './Avatar'

const css = {
  card: (dragging, optimistic) => ({
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    padding: '12px 14px',
    cursor: dragging ? 'grabbing' : 'grab',
    opacity: dragging ? 0.45 : optimistic ? 0.7 : 1,
    transform: dragging ? 'scale(1.03) rotate(1deg)' : 'scale(1)',
    transition: 'transform var(--transition-fast), opacity var(--transition-fast), background var(--transition-fast), box-shadow var(--transition-fast)',
    boxShadow: 'var(--shadow-card)',
    position: 'relative',
    userSelect: 'none',
  }),
  cardHoverLayer: {
    position: 'absolute',
    inset: 0,
    borderRadius: 'var(--radius-md)',
    background: 'rgba(255,255,255,0.02)',
    opacity: 0,
    transition: 'opacity var(--transition-fast)',
    pointerEvents: 'none',
  },
  title: {
    fontSize: 13.5,
    fontWeight: 500,
    color: 'var(--text-primary)',
    lineHeight: 1.45,
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    color: 'var(--text-secondary)',
    lineHeight: 1.5,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    marginBottom: 8,
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  actions: {
    display: 'flex',
    gap: 4,
    alignItems: 'center',
  },
  deleteBtn: (visible) => ({
    width: 26,
    height: 26,
    borderRadius: 6,
    background: 'transparent',
    color: 'var(--text-muted)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: visible ? 1 : 0,
    transform: visible ? 'scale(1)' : 'scale(0.85)',
    transition: 'opacity var(--transition-fast), transform var(--transition-fast), background var(--transition-fast), color var(--transition-fast)',
    cursor: 'pointer',
    fontSize: 14,
  }),
  optimisticBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: 'var(--warning)',
    animation: 'spin 1.2s linear infinite',
  },
}

export default function TaskCard({ card, columnId, onDelete, onDragStart, onDragEnd }) {
  const [hovered, setHovered] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleDragStart = (e) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData(
  'text/plain',
  JSON.stringify({
    cardId: card.cardId,
    sourceColumnId: columnId,
    cardPosition: card.position
  })
)
    setDragging(true)
    onDragStart?.()
  }

  const handleDragEnd = () => {
    setDragging(false)
    onDragEnd?.()
  }

  const handleDeleteClick = (e) => {
    e.stopPropagation()
    if (confirmDelete) {
      onDelete?.(card.cardId, columnId)
    } else {
      setConfirmDelete(true)
      setTimeout(() => setConfirmDelete(false), 2200)
    }
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setConfirmDelete(false) }}
      style={css.card(dragging, card._isOptimistic)}
    >
      {card._isOptimistic && <div style={css.optimisticBadge} />}

      <div style={{ ...css.cardHoverLayer, opacity: hovered && !dragging ? 1 : 0 }} />

      <div style={css.title}>{card.title}</div>

      {card.description && (
        <div style={css.description}>{card.description}</div>
      )}

      <div style={css.footer}>
        {card.assignedToName
          ? <Avatar name={card.assignedToName} size={22} />
          : <span />
        }

        <div style={css.actions}>
          <button
            style={{
              ...css.deleteBtn(hovered),
              ...(confirmDelete
                ? { background: 'var(--danger-light)', color: 'var(--danger)' }
                : { ':hover': { background: 'var(--danger-light)' } }),
            }}
            onMouseEnter={e => {
              if (!confirmDelete) {
                e.currentTarget.style.background = 'var(--danger-light)'
                e.currentTarget.style.color = 'var(--danger)'
              }
            }}
            onMouseLeave={e => {
              if (!confirmDelete) {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = 'var(--text-muted)'
              }
            }}
            onClick={handleDeleteClick}
            title={confirmDelete ? 'Click again to confirm' : 'Delete card'}
            aria-label="Delete card"
          >
            {confirmDelete ? '✕' : '⋯'}
          </button>
        </div>
      </div>
    </div>
  )
}
