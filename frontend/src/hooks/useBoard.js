import { useState, useCallback, useEffect, useRef } from 'react'
import {
  getBoard,
  createColumn,
  createCard,
  moveCard as apiMoveCard,
  deleteCard as apiDeleteCard,
  deleteColumn as apiDeleteColumn,
} from '../api/boardApi'
import {
  subscribeToBoard,
  subscribeToConnection,
} from '../api/socket'

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
  const [isLive, setIsLive] = useState(false)

  // ── Board WebSocket ───────────────────────────────────────
  // Receive-only. Writes go over REST; this subscription exists to hear
  // about changes, whoever made them. Any broadcast on
  // /topic/board/{boardId} triggers a refetch.
  const socketUnsubRef = useRef(null)
  const socketBoardIdRef = useRef(null)

  // Lets the UI say when live updates are off, instead of showing a board
  // that has quietly stopped updating.
  useEffect(() => subscribeToConnection(setIsLive), [])

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

  // ── Connect Board Socket ─────────────────────────────────
  // Subscribes to live move broadcasts for a board. Safe to call
  // repeatedly with the same boardId (no-op after the first).
  const connectBoardSocket = useCallback((boardId) => {
    if (!boardId || socketBoardIdRef.current === boardId) return

    socketUnsubRef.current?.()
    socketBoardIdRef.current = boardId

    // subscribeToBoard returns synchronously, so unmounting mid-handshake
    // cannot leave a subscription behind.
    socketUnsubRef.current = subscribeToBoard(boardId, {
      // A broadcast only says something changed; the refetch is what makes
      // this client agree with the server.
      onMessage: () => loadBoard(boardId),
      // A reconnect means broadcasts were missed outright — the backend's
      // simple broker cannot replay them.
      onResync: () => loadBoard(boardId),
    })
  }, [loadBoard])

  const disconnectBoardSocket = useCallback(() => {
    socketUnsubRef.current?.()
    socketUnsubRef.current = null
    socketBoardIdRef.current = null
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
      const created = await createColumn({ boardId, name, position: placeholder.position })
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

  // REST write: it stays behind JwtFilter and returns a status we can act
  // on. The server broadcasts the saved result, which is what reaches the
  // other clients — and comes back to us as a refetch we can ignore the
  // cost of. No refetch here: the optimistic state above already matches.
  await apiMoveCard(
    cardId,
    targetColumnId,
    newPosition
  )

} catch (err) {

  setBoard(snapshot)

  // 409: someone moved this card first, so the snapshot is stale too —
  // only the server knows where the card actually is now.
  if (err.status === 409) {
    loadBoard(board.boardId)
  }

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
  isLive,
  loadBoard,
  connectBoardSocket,
  disconnectBoardSocket,
  addColumn,
  addCard,
  moveCard,
  deleteCard,
  deleteColumn,
}
}
