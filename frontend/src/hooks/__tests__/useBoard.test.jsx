import { describe, test, expect, beforeEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'

vi.mock('../../api/boardApi', () => ({
  getBoard: vi.fn(),
  createColumn: vi.fn(),
  createCard: vi.fn(),
  moveCard: vi.fn(),
  deleteCard: vi.fn(),
  deleteColumn: vi.fn(),
}))

vi.mock('../../api/socket', () => ({
  subscribeToBoard: vi.fn(() => vi.fn()),
  subscribeToConnection: vi.fn(() => vi.fn()),
  isSocketConnected: vi.fn(() => false),
}))

import { useBoard } from '../useBoard'
import { getBoard, moveCard as apiMoveCard } from '../../api/boardApi'
import { subscribeToBoard, subscribeToConnection } from '../../api/socket'

/** Board with one card in Todo and an empty Doing column. */
const boardFixture = () => ({
  boardId: 1,
  name: 'Sprint',
  columns: [
    {
      columnId: 10,
      name: 'Todo',
      position: 1,
      cards: [{ cardId: 100, title: 'Card A', position: 1000 }],
    },
    { columnId: 20, name: 'Doing', position: 2, cards: [] },
  ],
})

/** Renders the hook with a board already loaded. */
async function renderLoadedBoard() {
  const { result } = renderHook(() => useBoard())
  await act(async () => {
    await result.current.loadBoard(1)
  })
  return result
}

const columnById = (board, columnId) =>
  board.columns.find(c => c.columnId === columnId)

beforeEach(() => {
  vi.clearAllMocks()
  getBoard.mockResolvedValue(boardFixture())
  apiMoveCard.mockResolvedValue({ cardId: 100, title: 'Card A', position: 1000 })
  subscribeToBoard.mockReturnValue(vi.fn())
  subscribeToConnection.mockReturnValue(vi.fn())
})

describe('moveCard', () => {
  test('sends the move over REST', async () => {
    // Arrange
    const result = await renderLoadedBoard()

    // Act
    await act(async () => {
      await result.current.moveCard(100, 10, 20, 0)
    })

    // Assert
    expect(apiMoveCard).toHaveBeenCalledWith(100, 20, 1000)
  })

  test('applies the move optimistically before the server answers', async () => {
    const result = await renderLoadedBoard()
    let resolveMove
    apiMoveCard.mockReturnValue(new Promise(resolve => { resolveMove = resolve }))

    let pending
    act(() => {
      pending = result.current.moveCard(100, 10, 20, 0)
    })

    expect(columnById(result.current.board, 20).cards).toHaveLength(1)
    expect(columnById(result.current.board, 10).cards).toHaveLength(0)

    await act(async () => {
      resolveMove({ cardId: 100 })
      await pending
    })
  })

  test('does not refetch on success: the broadcast drives that', async () => {
    const result = await renderLoadedBoard()
    getBoard.mockClear()

    await act(async () => {
      await result.current.moveCard(100, 10, 20, 0)
    })

    expect(getBoard).not.toHaveBeenCalled()
  })

  test('restores the previous board when the server rejects the move', async () => {
    const result = await renderLoadedBoard()
    apiMoveCard.mockRejectedValue(new Error('API 500: boom'))

    await act(async () => {
      await expect(result.current.moveCard(100, 10, 20, 0)).rejects.toThrow('boom')
    })

    expect(columnById(result.current.board, 10).cards).toHaveLength(1)
    expect(columnById(result.current.board, 20).cards).toHaveLength(0)
  })

  test('refetches the board when the server reports a conflict', async () => {
    // 409 means someone else moved the card first: server state wins.
    const result = await renderLoadedBoard()
    const conflict = new Error('API 409: version mismatch')
    conflict.status = 409
    apiMoveCard.mockRejectedValue(conflict)
    getBoard.mockClear()

    await act(async () => {
      await expect(result.current.moveCard(100, 10, 20, 0)).rejects.toThrow()
    })

    await waitFor(() => expect(getBoard).toHaveBeenCalledWith(1))
  })
})

describe('board socket', () => {
  test('subscribes to the board on connect', async () => {
    const result = await renderLoadedBoard()

    act(() => {
      result.current.connectBoardSocket(1)
    })

    expect(subscribeToBoard).toHaveBeenCalledWith(1, expect.any(Object))
  })

  test('refetches the board when another user broadcasts a move', async () => {
    const result = await renderLoadedBoard()
    act(() => {
      result.current.connectBoardSocket(1)
    })
    getBoard.mockClear()

    const { onMessage } = subscribeToBoard.mock.calls[0][1]
    await act(async () => {
      onMessage({ cardId: 100, targetColumnId: 20 })
    })

    expect(getBoard).toHaveBeenCalledWith(1)
  })

  test('refetches after a reconnect, to cover events missed while offline', async () => {
    const result = await renderLoadedBoard()
    act(() => {
      result.current.connectBoardSocket(1)
    })
    getBoard.mockClear()

    const { onResync } = subscribeToBoard.mock.calls[0][1]
    await act(async () => {
      onResync()
    })

    expect(getBoard).toHaveBeenCalledWith(1)
  })

  test('does not resubscribe when asked for the board it is already on', async () => {
    const result = await renderLoadedBoard()

    act(() => {
      result.current.connectBoardSocket(1)
      result.current.connectBoardSocket(1)
    })

    expect(subscribeToBoard).toHaveBeenCalledTimes(1)
  })

  test('unsubscribes on disconnect', async () => {
    const unsubscribe = vi.fn()
    subscribeToBoard.mockReturnValue(unsubscribe)
    const result = await renderLoadedBoard()

    act(() => {
      result.current.connectBoardSocket(1)
    })
    act(() => {
      result.current.disconnectBoardSocket()
    })

    expect(unsubscribe).toHaveBeenCalledTimes(1)
  })

  test('ignores a connect request with no board id', async () => {
    const result = await renderLoadedBoard()

    act(() => {
      result.current.connectBoardSocket(undefined)
    })

    expect(subscribeToBoard).not.toHaveBeenCalled()
  })

  test('reports live updates as off until the socket connects', async () => {
    const result = await renderLoadedBoard()

    expect(result.current.isLive).toBe(false)
  })

  test('reports live updates as on once the socket connects', async () => {
    const result = await renderLoadedBoard()
    const listener = subscribeToConnection.mock.calls[0][0]

    act(() => {
      listener(true)
    })

    expect(result.current.isLive).toBe(true)
  })
})
