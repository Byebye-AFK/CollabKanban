import { describe, test, expect } from 'vitest'
import {
  STATUS,
  BOARD_VIEWS,
  columnStatus,
  boardPrefix,
  cardKey,
  filterColumnsByView,
} from '../boardStatus'

describe('columnStatus', () => {
  test.each([
    ['Backlog', STATUS.BACKLOG],
    ['Icebox', STATUS.BACKLOG],
    ['Todo', STATUS.TODO],
    ['To do', STATUS.TODO],
    ['To-Do', STATUS.TODO],
    ['In Progress', STATUS.STARTED],
    ['in_progress', STATUS.STARTED],
    ['Doing', STATUS.STARTED],
    ['In review', STATUS.STARTED],
    ['Done', STATUS.DONE],
    ['Completed', STATUS.DONE],
    ['Shipped', STATUS.DONE],
    ['Canceled', STATUS.CANCELED],
    ['Cancelled', STATUS.CANCELED],
    ['Duplicate', STATUS.CANCELED],
  ])('reads %s as %s', (name, expected) => {
    expect(columnStatus(name)).toBe(expected)
  })

  test('ignores case and surrounding space', () => {
    expect(columnStatus('  DONE  ')).toBe(STATUS.DONE)
  })

  test('treats an unrecognised name as plain to-do work', () => {
    expect(columnStatus('Ideas for Q3')).toBe(STATUS.TODO)
  })

  test('treats a missing name as plain to-do work', () => {
    expect(columnStatus(undefined)).toBe(STATUS.TODO)
  })
})

describe('boardPrefix', () => {
  test('takes the initials of a multi-word name', () => {
    expect(boardPrefix('Product Roadmap')).toBe('PR')
  })

  test('caps initials at three letters', () => {
    expect(boardPrefix('Very Long Board Name Here')).toBe('VLB')
  })

  test('takes the first three letters of a single word', () => {
    expect(boardPrefix('Marketing')).toBe('MAR')
  })

  test('skips words that do not start with a letter', () => {
    expect(boardPrefix('Sprint 24')).toBe('SPR')
  })

  test('falls back to the app prefix when the name has no letters', () => {
    expect(boardPrefix('2025')).toBe('CK')
    expect(boardPrefix(undefined)).toBe('CK')
  })
})

describe('cardKey', () => {
  test('joins the board prefix and the card id', () => {
    expect(cardKey('Product Roadmap', 128)).toBe('PR-128')
  })

  test('shows a placeholder for a card the server has not numbered yet', () => {
    expect(cardKey('Product Roadmap', 'temp-card-1700000000')).toBe('PR-…')
  })
})

describe('filterColumnsByView', () => {
  const columns = [
    { columnId: 1, name: 'Backlog' },
    { columnId: 2, name: 'Todo' },
    { columnId: 3, name: 'In Progress' },
    { columnId: 4, name: 'Done' },
    { columnId: 5, name: 'Canceled' },
  ]
  const ids = cols => cols.map(c => c.columnId)

  test('offers all, active and backlog views', () => {
    expect(BOARD_VIEWS.map(v => v.id)).toEqual(['all', 'active', 'backlog'])
  })

  test('keeps every column in the all view', () => {
    expect(ids(filterColumnsByView(columns, 'all'))).toEqual([1, 2, 3, 4, 5])
  })

  test('keeps only to-do and started columns in the active view', () => {
    expect(ids(filterColumnsByView(columns, 'active'))).toEqual([2, 3])
  })

  test('keeps only backlog columns in the backlog view', () => {
    expect(ids(filterColumnsByView(columns, 'backlog'))).toEqual([1])
  })

  test('falls back to every column for an unknown view', () => {
    expect(ids(filterColumnsByView(columns, 'nope'))).toEqual([1, 2, 3, 4, 5])
  })

  test('tolerates a missing column list', () => {
    expect(filterColumnsByView(undefined, 'active')).toEqual([])
  })

  test('returns a new list rather than the one it was given', () => {
    expect(filterColumnsByView(columns, 'all')).not.toBe(columns)
  })
})
