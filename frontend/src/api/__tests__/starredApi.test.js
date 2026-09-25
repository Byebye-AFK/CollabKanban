import { describe, test, expect, beforeEach } from 'vitest'
import { STARRED_KEY, getStarred, toggleStar, filterStarred } from '../starredApi'

beforeEach(() => {
  localStorage.clear()
})

describe('getStarred', () => {
  test('returns an empty list when nothing has been starred', () => {
    expect(getStarred()).toEqual([])
  })

  test('reads back the ids previously written to storage', () => {
    localStorage.setItem(STARRED_KEY, JSON.stringify([3, 7]))

    expect(getStarred()).toEqual([3, 7])
  })

  test('returns an empty list when the stored value is not valid JSON', () => {
    localStorage.setItem(STARRED_KEY, 'not json')

    expect(getStarred()).toEqual([])
  })

  test('returns an empty list when the stored value is not an array', () => {
    localStorage.setItem(STARRED_KEY, JSON.stringify({ boardId: 3 }))

    expect(getStarred()).toEqual([])
  })
})

describe('toggleStar', () => {
  test('adds a board that was not starred', () => {
    expect(toggleStar(4)).toEqual([4])
  })

  test('removes a board that was already starred', () => {
    toggleStar(4)

    expect(toggleStar(4)).toEqual([])
  })

  test('keeps the boards already starred when adding another', () => {
    toggleStar(1)

    expect(toggleStar(2)).toEqual([1, 2])
  })

  test('persists the new list to storage', () => {
    toggleStar(9)

    expect(JSON.parse(localStorage.getItem(STARRED_KEY))).toEqual([9])
  })

  test('leaves the previous list untouched rather than mutating it', () => {
    const before = toggleStar(1)

    toggleStar(2)

    expect(before).toEqual([1])
  })
})

describe('filterStarred', () => {
  const boards = [
    { boardId: 1, name: 'Sprint 24' },
    { boardId: 2, name: 'Roadmap' },
    { boardId: 3, name: 'Bugs' },
  ]

  test('keeps only the boards whose id is starred', () => {
    expect(filterStarred(boards, [3, 1]).map(b => b.name)).toEqual(['Sprint 24', 'Bugs'])
  })

  test('returns an empty list when nothing is starred', () => {
    expect(filterStarred(boards, [])).toEqual([])
  })

  test('ignores starred ids that match no board', () => {
    expect(filterStarred(boards, [99])).toEqual([])
  })

  test('tolerates a missing boards list', () => {
    expect(filterStarred(undefined, [1])).toEqual([])
  })
})
