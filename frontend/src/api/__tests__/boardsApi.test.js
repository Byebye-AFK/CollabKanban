import { describe, test, expect } from 'vitest'
import {
  boardProgress,
  progressPercent,
  flattenBoards,
  sortBoards,
  filterBoards,
} from '../boardsApi'

/** A live-shaped board: columns, each holding cards. */
const liveBoard = (columns) => ({ boardId: 1, name: 'Live', columns })

describe('boardProgress', () => {
  test('counts cards across columns when the payload carries them', () => {
    // Arrange
    const board = liveBoard([
      { name: 'Todo', cards: [{}, {}, {}] },
      { name: 'Doing', cards: [{}] },
      { name: 'Done', cards: [{}, {}] },
    ])

    // Act
    const progress = boardProgress(board)

    // Assert
    expect(progress).toEqual({ known: true, total: 6, done: 2, columnCount: 3 })
  })

  test('matches done columns regardless of case and surrounding space', () => {
    const board = liveBoard([
      { name: '  DONE  ', cards: [{}] },
      { name: 'Shipped', cards: [{}] },
      { name: 'Todo', cards: [{}] },
    ])

    expect(boardProgress(board).done).toBe(2)
  })

  test('reports zero done when no column name matches, rather than guessing', () => {
    const board = liveBoard([
      { name: 'Ready for QA', cards: [{}, {}] },
      { name: 'Icebox', cards: [{}] },
    ])

    const progress = boardProgress(board)

    expect(progress.total).toBe(3)
    expect(progress.done).toBe(0)
  })

  test('treats a column with no cards array as empty', () => {
    const board = liveBoard([{ name: 'Todo' }, { name: 'Done', cards: [{}] }])

    expect(boardProgress(board)).toEqual({ known: true, total: 1, done: 1, columnCount: 2 })
  })

  test('uses the explicit counters the demo snapshot supplies', () => {
    const progress = boardProgress({ boardId: 2, name: 'Demo', cards: 34, done: 24 })

    expect(progress).toEqual({ known: true, total: 34, done: 24, columnCount: 0 })
  })

  test('defaults done to zero when only a card total is given', () => {
    expect(boardProgress({ cards: 10 }).done).toBe(0)
  })

  test('reports known:false when the payload says nothing about cards', () => {
    expect(boardProgress({ boardId: 3, name: 'Bare' })).toEqual({
      known: false, total: 0, done: 0, columnCount: 0,
    })
  })

  test('prefers columns over counters when a board carries both', () => {
    const board = { columns: [{ name: 'Done', cards: [{}] }], cards: 99, done: 98 }

    expect(boardProgress(board).total).toBe(1)
  })

  test('does not throw on null or undefined', () => {
    expect(boardProgress(null).known).toBe(false)
    expect(boardProgress(undefined).known).toBe(false)
  })
})

describe('progressPercent', () => {
  test('rounds the done share to a whole percent', () => {
    expect(progressPercent({ known: true, total: 3, done: 1 })).toBe(33)
  })

  test('returns 0 for an empty board rather than dividing by zero', () => {
    expect(progressPercent({ known: true, total: 0, done: 0 })).toBe(0)
  })

  test('returns 0 when progress is unknown', () => {
    expect(progressPercent({ known: false, total: 0, done: 0 })).toBe(0)
  })

  test('returns 0 when handed nothing', () => {
    expect(progressPercent(undefined)).toBe(0)
  })
})

const workspaces = [
  {
    workspaceId: 2,
    name: 'Growth Lab',
    role: 'ADMIN',
    members: ['Aria Patel'],
    boards: [{ boardId: 4, name: 'Q3 Campaigns', cards: 22, done: 9 }],
  },
  {
    workspaceId: 1,
    name: 'Product Core',
    role: 'OWNER',
    members: ['Sara Nolan', 'Dan Kite'],
    boards: [
      { boardId: 1, name: 'Sprint 24', cards: 34, done: 24 },
      { boardId: 2, name: 'Roadmap', cards: 18, done: 11 },
    ],
  },
]

describe('flattenBoards', () => {
  test('returns one entry per board across every workspace', () => {
    const boards = flattenBoards(workspaces)

    expect(boards).toHaveLength(3)
    expect(boards.map(b => b.boardId)).toEqual([4, 1, 2])
  })

  test('carries the workspace context each card needs to stand alone', () => {
    const [first] = flattenBoards(workspaces)

    expect(first).toMatchObject({
      name: 'Q3 Campaigns',
      workspaceId: 2,
      workspaceName: 'Growth Lab',
      role: 'ADMIN',
      members: ['Aria Patel'],
    })
    expect(first.workspace).toBe(workspaces[0])
  })

  test('attaches the last-visited timestamp from recents', () => {
    const boards = flattenBoards(workspaces, [{ boardId: 2, at: 1700000000000 }])

    expect(boards.find(b => b.boardId === 2).lastVisitedAt).toBe(1700000000000)
    expect(boards.find(b => b.boardId === 1).lastVisitedAt).toBeNull()
  })

  test('returns an empty list for no workspaces', () => {
    expect(flattenBoards()).toEqual([])
    expect(flattenBoards([])).toEqual([])
  })

  test('skips a workspace carrying no boards array', () => {
    expect(flattenBoards([{ workspaceId: 9, name: 'Empty' }])).toEqual([])
  })
})

describe('sortBoards', () => {
  const boards = flattenBoards(workspaces, [{ boardId: 2, at: 500 }])

  test('sorts by name A–Z', () => {
    expect(sortBoards(boards, 'name').map(b => b.name))
      .toEqual(['Q3 Campaigns', 'Roadmap', 'Sprint 24'])
  })

  test('sorts by card count, largest first', () => {
    expect(sortBoards(boards, 'cards').map(b => b.progress.total)).toEqual([34, 22, 18])
  })

  test('sorts by workspace, then by board name within it', () => {
    expect(sortBoards(boards, 'workspace').map(b => b.name))
      .toEqual(['Q3 Campaigns', 'Roadmap', 'Sprint 24'])
  })

  test('puts never-opened boards last when sorting by recency', () => {
    const [first, ...rest] = sortBoards(boards, 'recent')

    expect(first.boardId).toBe(2)
    expect(rest.every(b => b.lastVisitedAt === null)).toBe(true)
  })

  test('falls back to name order for an unknown sort id', () => {
    expect(sortBoards(boards, 'nonsense').map(b => b.name))
      .toEqual(sortBoards(boards, 'name').map(b => b.name))
  })

  test('returns a new array and leaves the input order untouched', () => {
    const original = [...boards]
    const sorted = sortBoards(boards, 'cards')

    expect(sorted).not.toBe(boards)
    expect(boards).toEqual(original)
  })
})

describe('filterBoards', () => {
  const boards = flattenBoards(workspaces)

  test('matches on board name, ignoring case', () => {
    expect(filterBoards(boards, 'sprint').map(b => b.name)).toEqual(['Sprint 24'])
  })

  test('matches on workspace name', () => {
    expect(filterBoards(boards, 'growth').map(b => b.name)).toEqual(['Q3 Campaigns'])
  })

  test('returns every board for an empty or whitespace query', () => {
    expect(filterBoards(boards, '')).toBe(boards)
    expect(filterBoards(boards, '   ')).toBe(boards)
  })

  test('returns an empty array when nothing matches', () => {
    expect(filterBoards(boards, 'zzz')).toEqual([])
  })
})
