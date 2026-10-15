import React, { useState } from 'react'
import { StatusIcon, ChevronDown, EyeIcon } from '../shell/icons'
import { columnStatus } from '../../api/boardStatus'

/**
 * The "Hidden columns" panel at the right of the board, after Linear's.
 *
 * Columns tucked away here still accept cards: dragging a card onto a
 * row files it at the bottom of that column, which is how a finished
 * card goes to a hidden Done without opening it back up.
 */
function readDrop(e) {
  try {
    const data = JSON.parse(e.dataTransfer.getData('text/plain'))
    return data?.cardId ? data : null
  } catch {
    return null
  }
}

function HiddenRow({ column, onShow, onMoveCard }) {
  const [isOver, setOver] = useState(false)
  const count = column.cards?.length ?? 0

  return (
    <li
      className={`brd-hidden-row${isOver ? ' is-over' : ''}`}
      aria-label={`${column.name}, ${count} ${count === 1 ? 'card' : 'cards'}`}
      onDragOver={e => { e.preventDefault(); setOver(true) }}
      onDragLeave={() => setOver(false)}
      onDrop={e => {
        e.preventDefault()
        setOver(false)
        const data = readDrop(e)
        if (data) onMoveCard?.(data.cardId, data.sourceColumnId, column.columnId, count)
      }}
    >
      <StatusIcon status={columnStatus(column.name)} />
      <span className="brd-hidden-name">{column.name}</span>
      <span className="brd-hidden-count">{count}</span>
      <button
        className="ui-iconbtn is-sm brd-hidden-show"
        onClick={() => onShow?.(column.columnId)}
        aria-label={`Show ${column.name}`}
        title="Show column"
      >
        <EyeIcon size={14} />
      </button>
    </li>
  )
}

export default function HiddenColumns({ columns = [], onShow, onMoveCard }) {
  const [isOpen, setOpen] = useState(true)
  if (columns.length === 0) return null

  return (
    <aside className="brd-hidden" aria-label="Hidden columns">
      <div className="brd-hidden-inner">
        <button
          className={`brd-hidden-head${isOpen ? ' is-open' : ''}`}
          onClick={() => setOpen(o => !o)}
          aria-expanded={isOpen}
        >
          <ChevronDown size={10} />
          Hidden columns
        </button>
        {isOpen && (
          <ul className="brd-hidden-list">
            {columns.map(col => (
              <HiddenRow key={col.columnId} column={col} onShow={onShow} onMoveCard={onMoveCard} />
            ))}
          </ul>
        )}
      </div>
    </aside>
  )
}
