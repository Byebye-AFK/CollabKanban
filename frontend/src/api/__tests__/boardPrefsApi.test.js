import { describe, test, expect, beforeEach } from 'vitest'
import {
  HIDDEN_KEY,
  DISPLAY_KEY,
  DEFAULT_DISPLAY,
  getHidden,
  toggleHidden,
  partitionColumns,
  getDisplay,
  setDisplay,
} from '../boardPrefsApi'

beforeEach(() => {
  localStorage.clear()
})

describe('getHidden', () => {
  test('returns an empty list for a board with nothing hidden', () => {
    expect(getHidden(1)).toEqual([])
  })

  test('reads back only the given board’s hidden columns', () => {
    localStorage.setItem(HIDDEN_KEY, JSON.stringify({ 1: [10, 11], 2: [20] }))

    expect(getHidden(1)).toEqual([10, 11])
  })

  test('returns an empty list when storage holds invalid JSON', () => {
    localStorage.setItem(HIDDEN_KEY, '{nope')

    expect(getHidden(1)).toEqual([])
  })

  test('returns an empty list when the board entry is not an array', () => {
    localStorage.setItem(HIDDEN_KEY, JSON.stringify({ 1: 'x' }))

    expect(getHidden(1)).toEqual([])
  })
})

describe('toggleHidden', () => {
  test('hides a visible column', () => {
    expect(toggleHidden(1, 10)).toEqual([10])
  })

  test('shows a hidden column again', () => {
    toggleHidden(1, 10)

    expect(toggleHidden(1, 10)).toEqual([])
  })

  test('leaves other boards untouched', () => {
    toggleHidden(2, 20)
    toggleHidden(1, 10)

    expect(getHidden(2)).toEqual([20])
  })

  test('does not mutate the list returned earlier', () => {
    const before = toggleHidden(1, 10)

    toggleHidden(1, 11)

    expect(before).toEqual([10])
  })
})

describe('partitionColumns', () => {
  const columns = [{ columnId: 1 }, { columnId: 2 }, { columnId: 3 }]

  test('splits columns into shown and hidden, keeping board order', () => {
    const { shown, hidden } = partitionColumns(columns, [3, 1])

    expect(shown.map(c => c.columnId)).toEqual([2])
    expect(hidden.map(c => c.columnId)).toEqual([1, 3])
  })

  test('ignores hidden ids that match no column', () => {
    expect(partitionColumns(columns, [99]).hidden).toEqual([])
  })

  test('tolerates missing inputs', () => {
    expect(partitionColumns(undefined, undefined)).toEqual({ shown: [], hidden: [] })
  })
})

describe('display preferences', () => {
  test('starts from the defaults', () => {
    expect(getDisplay()).toEqual(DEFAULT_DISPLAY)
  })

  test('merges a change over the current preferences and persists it', () => {
    const next = setDisplay({ showDescriptions: false })

    expect(next).toEqual({ ...DEFAULT_DISPLAY, showDescriptions: false })
    expect(getDisplay()).toEqual(next)
  })

  test('drops keys it does not know and non-boolean values', () => {
    localStorage.setItem(DISPLAY_KEY, JSON.stringify({ showDescriptions: 'yes', other: true }))

    expect(getDisplay()).toEqual(DEFAULT_DISPLAY)
  })

  test('falls back to the defaults when storage holds invalid JSON', () => {
    localStorage.setItem(DISPLAY_KEY, 'nope')

    expect(getDisplay()).toEqual(DEFAULT_DISPLAY)
  })
})
