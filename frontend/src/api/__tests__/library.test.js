import { describe, test, expect } from 'vitest'
import { filterBy, sortBy, groupByWorkspace } from '../library'

const items = [
  { name: 'Roadmap', workspaceId: 1, workspaceName: 'Product Core', size: 18 },
  { name: 'Sprint 24', workspaceId: 1, workspaceName: 'Product Core', size: 34 },
  { name: 'Q3 Campaigns', workspaceId: 2, workspaceName: 'Growth Lab', size: 22 },
]

describe('filterBy', () => {
  test('matches any of the named fields, ignoring case', () => {
    expect(filterBy(items, 'SPRINT', ['name']).map(i => i.name)).toEqual(['Sprint 24'])
    expect(filterBy(items, 'growth', ['workspaceName']).map(i => i.name)).toEqual(['Q3 Campaigns'])
  })

  test('searches across every field it is given', () => {
    expect(filterBy(items, 'core', ['name', 'workspaceName'])).toHaveLength(2)
  })

  test('returns the same array for an empty or whitespace query', () => {
    expect(filterBy(items, '', ['name'])).toBe(items)
    expect(filterBy(items, '   ', ['name'])).toBe(items)
  })

  test('returns an empty array when nothing matches', () => {
    expect(filterBy(items, 'zzz', ['name'])).toEqual([])
  })

  test('tolerates items missing the field', () => {
    expect(filterBy([{ name: 'a' }], 'x', ['missing'])).toEqual([])
  })

  test('returns an empty list when given nothing', () => {
    expect(filterBy(undefined, 'x', ['name'])).toEqual([])
  })
})

describe('sortBy', () => {
  const comparators = {
    name: (a, b) => a.name.localeCompare(b.name),
    size: (a, b) => b.size - a.size,
  }

  test('sorts with the comparator named by the id', () => {
    expect(sortBy(items, comparators, 'size').map(i => i.size)).toEqual([34, 22, 18])
  })

  test('falls back to the named default for an unknown id', () => {
    expect(sortBy(items, comparators, 'nonsense', 'name').map(i => i.name))
      .toEqual(['Q3 Campaigns', 'Roadmap', 'Sprint 24'])
  })

  test('returns a copy untouched when no comparator resolves', () => {
    const out = sortBy(items, comparators, 'nope', 'alsoNope')
    expect(out).toEqual(items)
    expect(out).not.toBe(items)
  })

  test('returns a new array and leaves the input order alone', () => {
    const original = [...items]
    const sorted = sortBy(items, comparators, 'size')
    expect(sorted).not.toBe(items)
    expect(items).toEqual(original)
  })
})

describe('groupByWorkspace', () => {
  test('groups items under their workspace', () => {
    const groups = groupByWorkspace(items)

    expect(groups.map(g => g.name)).toEqual(['Product Core', 'Growth Lab'])
    expect(groups[0].items.map(i => i.name)).toEqual(['Roadmap', 'Sprint 24'])
    expect(groups[1].items).toHaveLength(1)
  })

  test('preserves the order items arrived in', () => {
    const reordered = [items[2], items[1], items[0]]

    expect(groupByWorkspace(reordered).map(g => g.name)).toEqual(['Growth Lab', 'Product Core'])
  })

  test('carries the workspace id onto each group', () => {
    expect(groupByWorkspace(items).map(g => g.workspaceId)).toEqual([1, 2])
  })

  test('returns an empty list for no items', () => {
    expect(groupByWorkspace([])).toEqual([])
    expect(groupByWorkspace()).toEqual([])
  })
})
