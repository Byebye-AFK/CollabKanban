import { useState, useCallback } from 'react'
import {
  getBoard,
  createColumn,
  createCard,
  moveCard as apiMoveCard,
  deleteCard as apiDeleteCard,
  deleteColumn as apiDeleteColumn,
} from '../api/boardApi'

/**
 * useBoard
 * Central state hook for a single board.
 * Provides optimistic updates for move, delete, add operations
 * so the UI responds instantly without waiting for the server.
 */
export function useBoard() {
  const [board, setBoard] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // ── Load ──────────────────────────────────────────────────
  const loadBoard = useCallback(async (boardId) => {
    setLoading(true)
    setError(null)
    try {
      const data = await getBoard(boardId)
      // Sort columns and cards by position
      const sorted = {
        ...data,
        columns: [...(data.columns || [])].sort((a, b) => a.position - b.position).map(col => ({
          ...col,
          cards: [...(col.cards || [])].sort((a, b) => a.position - b.position),
        })),
      }
      setBoard(sorted)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // ── Add Column ────────────────────────────────────────────
  const addColumn = useCallback(async (boardId, name) => {
    // Optimistic: add a placeholder column immediately
    const tempId = `temp-col-${Date.now()}`
    const maxPos = board?.columns?.reduce((m, c) => Math.max(m, c.position), 0) ?? 0
    const placeholder = {
      columnId: tempId,
      name,
      position: maxPos + 1000,
      cards: [],
      _isOptimistic: true,
    }

    setBoard(prev => ({
      ...prev,
      columns: [...(prev.columns ?? []), placeholder],
    }))

    try {
      const created = await createColumn(boardId, name)
      // Replace placeholder with real column from server
      setBoard(prev => ({
        ...prev,
        columns: prev.columns.map(col =>
          col.columnId === tempId ? { ...created, cards: [] } : col
        ),
      }))
    } catch (err) {
      // Revert
      setBoard(prev => ({
        ...prev,
        columns: prev.columns.filter(col => col.columnId !== tempId),
      }))
      throw err
    }
  }, [board])

  // ── Add Card ──────────────────────────────────────────────
  const addCard = useCallback(async (payload) => {
    const tempId = `temp-card-${Date.now()}`
    const placeholder = {
      cardId: tempId,
      title: payload.title,
      description: payload.description ?? '',
      position: Date.now(),
      assignedToUserId: payload.assignedToUserId ?? null,
      assignedToName: null,
      _isOptimistic: true,
    }

    // Optimistic: push card into the correct column
    setBoard(prev => ({
      ...prev,
      columns: prev.columns.map(col =>
        col.columnId === payload.columnId
          ? { ...col, cards: [...col.cards, placeholder] }
          : col
      ),
    }))

    try {
      const created = await createCard(payload)
      // Replace placeholder with real card
      setBoard(prev => ({
        ...prev,
        columns: prev.columns.map(col =>
          col.columnId === payload.columnId
            ? { ...col, cards: col.cards.map(c => c.cardId === tempId ? created : c) }
            : col
        ),
      }))
    } catch (err) {
      // Revert
      setBoard(prev => ({
        ...prev,
        columns: prev.columns.map(col =>
          col.columnId === payload.columnId
            ? { ...col, cards: col.cards.filter(c => c.cardId !== tempId) }
            : col
        ),
      }))
      throw err
    }
  }, [])

  // ── Move Card ─────────────────────────────────────────────
const moveCard = useCallback(async (
  cardId,
  sourceColumnId,
  targetColumnId,
  targetIndex
) => {
  console.log(
  "targetIndex:",
  targetIndex
)

  const snapshot = board

const targetColumn = board.columns.find(
  c => c.columnId === targetColumnId
)


const cards = [...(targetColumn?.cards || [])]

const filteredCards =
  sourceColumnId === targetColumnId
    ? cards.filter(c => c.cardId !== cardId)
    : cards

let newPosition

if (filteredCards.length === 0) {

  newPosition = 1000

} else if (targetIndex === 0) {

  newPosition =
    (filteredCards[0].position || 1000) - 1000

} else if (targetIndex >= filteredCards.length) {

  newPosition =
    (filteredCards[filteredCards.length - 1].position || 0) + 1000

} else {

  const prevPos =
    filteredCards[targetIndex - 1].position

  const nextPos =
    filteredCards[targetIndex].position

  newPosition = Math.floor(
    (prevPos + nextPos) / 2
  )
}

setBoard(prev => {

  let movedCard = null

  const columns = prev.columns.map(col => {

    if (col.columnId === sourceColumnId) {

      movedCard = col.cards.find(
        c => c.cardId === cardId
      )

      return {
        ...col,
        cards: col.cards.filter(
          c => c.cardId !== cardId
        )
      }
    }

    return col
  })

  return {
    ...prev,
    columns: columns.map(col => {

      if (
        col.columnId === targetColumnId &&
        movedCard
      ) {

        const updatedCards = [...col.cards]

        updatedCards.splice(
          targetIndex,
          0,
          {
            ...movedCard,
            position: newPosition
          }
        )

        return {
          ...col,
          cards: updatedCards
        }
      }

      return col
    })
  }
})

try {

  await apiMoveCard(
    cardId,
    targetColumnId,
    newPosition
  )

  await loadBoard(board.boardId)

} catch (err) {

  setBoard(snapshot)
  throw err

}

}, [board, loadBoard])

  // ── Delete Card ───────────────────────────────────────────
  const deleteCard = useCallback(async (cardId, columnId) => {
    const snapshot = board

    // Optimistic: remove card immediately
    setBoard(prev => ({
      ...prev,
      columns: prev.columns.map(col =>
        col.columnId === columnId
          ? { ...col, cards: col.cards.filter(c => c.cardId !== cardId) }
          : col
      ),
    }))

    try {
      await apiDeleteCard(cardId)
    } catch (err) {
      setBoard(snapshot)
      throw err
    }
  }, [board])

  const deleteColumn = useCallback(async (columnId) => {

    console.log("Delete Column hook called",columnId)
  const snapshot = board

  setBoard(prev => ({
    ...prev,
    columns: prev.columns.filter(
      col => col.columnId !== columnId
    )
  }))

  try {

    await apiDeleteColumn(columnId)

  } catch (err) {

    setBoard(snapshot)
    throw err

  }

}, [board])

return {
  board,
  loading,
  error,
  loadBoard,
  addColumn,
  addCard,
  moveCard,
  deleteCard,
  deleteColumn,
}
}
