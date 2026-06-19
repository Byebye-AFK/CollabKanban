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

const COLUMN_WIDTH = 290

function css(color, isDragOver) {
  return {
    column: {
      width: COLUMN_WIDTH,
      minWidth: COLUMN_WIDTH,
      display: 'flex',
      flexDirection: 'column',
      background: isDragOver
        ? `linear-gradient(180deg, ${color}14 0%, var(--bg-column) 80px)`
        : 'var(--bg-column)',
      border: `1px solid ${isDragOver ? color + '40' : 'var(--border)'}`,
      borderRadius: 'var(--radius-lg)',
      transition: 'background var(--transition-mid), border-color var(--transition-fast), box-shadow var(--transition-fast)',
      boxShadow: isDragOver
        ? `0 0 0 2px ${color}22, var(--shadow-column)`
        : 'var(--shadow-column)',
      flexShrink: 0,
      maxHeight: 'calc(100vh - 140px)',
      overflow: 'hidden',
    },
    header: {
      padding: '14px 14px 10px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
      flexShrink: 0,
    },
    titleRow: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      minWidth: 0,
      flex: 1,
    },
    colorDot: {
      width: 8,
      height: 8,
      borderRadius: '50%',
      background: color,
      flexShrink: 0,
    },
    colorBar: {
      width: 3,
      height: 16,
      borderRadius: 99,
      background: color,
      flexShrink: 0,
    },
    columnName: {
      fontSize: 13,
      fontWeight: 600,
      color: 'var(--text-primary)',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
    countBadge: {
      fontSize: 11,
      fontWeight: 600,
      padding: '2px 7px',
      borderRadius: 99,
      background: `${color}20`,
      color: color,
      letterSpacing: '0.02em',
      flexShrink: 0,
    },
    divider: {
      height: 1,
      background: 'var(--border)',
      margin: '0 14px',
      flexShrink: 0,
    },
    cardList: {
      flex: 1,
      overflowY: 'auto',
      padding: '10px 10px 6px',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      overflowX: 'hidden',
    },
    dropZone: (active) => ({
      minHeight: 48,
      borderRadius: 'var(--radius-md)',
      border: `2px dashed ${active ? color + '60' : 'transparent'}`,
      background: active ? `${color}08` : 'transparent',
      transition: 'all var(--transition-fast)',
      display: active ? 'flex' : 'none',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 12,
      color: color,
      fontWeight: 500,
      flexShrink: 0,
    }),
    footer: {
      padding: '8px 10px 12px',
      flexShrink: 0,
    },
    addCardBtn: {
      width: '100%',
      padding: '7px 10px',
      borderRadius: 'var(--radius-sm)',
      background: 'transparent',
      border: '1px solid transparent',
      color: 'var(--text-muted)',
      fontSize: 13,
      fontWeight: 500,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      transition: 'background var(--transition-fast), color var(--transition-fast), border-color var(--transition-fast)',
      textAlign: 'left',
    },
    deleteColumnBtn: {
  width: 24,
  height: 24,
  borderRadius: '50%',
  background: 'rgba(239,68,68,0.15)',
  border: 'none',
  color: '#ef4444',
  cursor: 'pointer',
  fontSize: 14,
  fontWeight: 700,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.2s ease',
},
  }
}

export default function KanbanColumn({
  column,
  columnIndex,
  onAddCard,
  onDeleteCard,
  onDeleteColumn,
  onMoveCard
}) {
  console.log("onDeleteColumn", onDeleteColumn)
  const [isDragOver, setIsDragOver] = useState(false)
  const [showAddCard, setShowAddCard] = useState(false)
  const [addBtnHover, setAddBtnHover] = useState(false)

  const color = columnColor(columnIndex)
  const styles = css(color, isDragOver)

  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setIsDragOver(true)
  }

  const handleDragLeave = (e) => {
    // Only fire if leaving the column entirely (not just entering a child)
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragOver(false)
    }
  }

const handleDrop = (e, targetIndex) => {

  console.log("HANDLE DROP TARGET INDEX", targetIndex)
  e.preventDefault()
  setIsDragOver(false)

  try {
    const data = JSON.parse(
      e.dataTransfer.getData('text/plain')
    )

    onMoveCard?.(
      data.cardId,
      data.sourceColumnId,
      column.columnId,
      targetIndex
    )

  } catch (_) {}
}

  return (
    <>
     <div
  style={styles.column}
  onDragLeave={handleDragLeave}
>
        {/* ── Header ── */}
        <div style={styles.header}>
  <div style={styles.titleRow}>
    <div style={styles.colorBar} />
    <span
      style={styles.columnName}
      title={column.name}
    >
      {column.name}
    </span>
  </div>

  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
    }}
  >
    <span style={styles.countBadge}>
      {column.cards?.length ?? 0}
    </span>

    <button
  style={styles.deleteColumnBtn}
  onMouseEnter={(e) => {
    e.currentTarget.style.background = 'rgba(239,68,68,0.25)'
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.background = 'rgba(239,68,68,0.15)'
  }}
  onClick={() => {
    if (
      window.confirm(
        `Delete "${column.name}" and all cards inside it?`
      )
    ) {
      onDeleteColumn?.(column.columnId)
    }
  }}
  title="Delete Column"
>
  ✕
</button>
  </div>
</div>

        {/* ── Cards ── */}
 <div style={styles.cardList}>

  <div
    onDragOver={handleDragOver}
    onDrop={(e) => handleDrop(e, 0)}
    style={{
      height: 12,
      borderRadius: 4,
      background: isDragOver ? `${color}22` : 'transparent',
      marginBottom: 4,
    }}
  />

  {(column.cards ?? []).map((card, index) => (
    <React.Fragment key={card.cardId}>

      <TaskCard
        card={card}
        columnId={column.columnId}
        onDelete={onDeleteCard}
      />

      <div
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, index + 1)}
        style={{
          height: 12,
          borderRadius: 4,
          background: isDragOver ? `${color}22` : 'transparent',
          marginTop: 4,
          marginBottom: 4,
        }}
      />

    </React.Fragment>
  ))}
</div>
        {/* ── Footer ── */}
        <div style={styles.footer}>
          <button
            style={{
              ...styles.addCardBtn,
              ...(addBtnHover ? {
                background: 'rgba(255,255,255,0.04)',
                color: 'var(--text-secondary)',
                borderColor: 'var(--border)',
              } : {}),
            }}
            onMouseEnter={() => setAddBtnHover(true)}
            onMouseLeave={() => setAddBtnHover(false)}
            onClick={() => setShowAddCard(true)}
          >
            <span style={{ fontSize: 16, lineHeight: 1 }}>+</span>
            Add card
          </button>
        </div>
      </div>

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
