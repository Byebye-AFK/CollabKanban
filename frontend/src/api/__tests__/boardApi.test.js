import { describe, test, expect, vi, afterEach } from 'vitest'
import { createBoard, moveCard } from '../boardApi'

function mockFetch(body) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve(body),
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

describe('createBoard', () => {
  afterEach(() => vi.unstubAllGlobals())

  test('posts the board with its workspace, team and position', async () => {
    const fetchMock = mockFetch({ boardId: 9, name: 'Sprint 25', teamId: 4, columns: [] })

    const board = await createBoard({ name: ' Sprint 25 ', workspaceId: 7, teamId: 4, position: 2 })

    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toBe('http://localhost:8080/board/create')
    expect(options.method).toBe('POST')
    expect(JSON.parse(options.body)).toEqual({ name: 'Sprint 25', workspaceId: 7, teamId: 4, position: 2 })
    expect(board.boardId).toBe(9)
  })

  test('rejects a blank name before calling the server', async () => {
    const fetchMock = mockFetch({})

    await expect(createBoard({ name: '  ', workspaceId: 7, teamId: 4 })).rejects.toThrow('Give the board a name.')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  test('rejects a missing team before calling the server', async () => {
    const fetchMock = mockFetch({})

    await expect(createBoard({ name: 'Sprint', workspaceId: 7 })).rejects.toThrow('Pick a team for the board.')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('moveCard', () => {
  afterEach(() => vi.unstubAllGlobals())

  test('sends the card version when the client has one', async () => {
    const fetchMock = mockFetch({ cardId: 5, version: 4 })

    const saved = await moveCard(5, 20, 2500, 3)

    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toBe('http://localhost:8080/card/move/5')
    expect(options.method).toBe('PUT')
    expect(JSON.parse(options.body)).toEqual({ targetColumnId: 20, position: 2500, version: 3 })
    expect(saved.version).toBe(4)
  })

  test('leaves the version out when the client has none', async () => {
    const fetchMock = mockFetch({ cardId: 5 })

    await moveCard(5, 20, 2500)

    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ targetColumnId: 20, position: 2500 })
  })
})
