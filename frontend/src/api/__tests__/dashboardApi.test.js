import { describe, test, expect } from 'vitest'
import { normalizeWorkspace, relativeTime } from '../dashboardApi'

/** Exactly the shape Spring's WorkSpaceResponse serialises. */
const apiWorkspace = {
  workSpaceId: 7,
  name: 'Product Core',
  role: 'OWNER',
  members: [
    { userName: 'Sara Nolan', userEmail: 'sara@example.com' },
    { userName: 'Dan Kite', userEmail: 'dan@example.com' },
  ],
  teams: [{ teamName: 'Design', count: 4 }],
  boards: [{ boardId: 1, name: 'Sprint 24', columns: [{ columnId: 1, name: 'Done', cards: [{}] }] }],
}

describe('normalizeWorkspace', () => {
  test('maps the API workSpaceId onto workspaceId', () => {
    expect(normalizeWorkspace(apiWorkspace).workspaceId).toBe(7)
  })

  test('flattens member objects down to display names', () => {
    expect(normalizeWorkspace(apiWorkspace).members).toEqual(['Sara Nolan', 'Dan Kite'])
  })

  test('falls back to the email when a member has no name', () => {
    const ws = { ...apiWorkspace, members: [{ userEmail: 'nobody@example.com' }] }

    expect(normalizeWorkspace(ws).members).toEqual(['nobody@example.com'])
  })

  test('passes plain string members through untouched', () => {
    const ws = { ...apiWorkspace, members: ['Aria Patel'] }

    expect(normalizeWorkspace(ws).members).toEqual(['Aria Patel'])
  })

  test('maps teamName/count onto name/memberCount and gives each team an id', () => {
    const [team] = normalizeWorkspace(apiWorkspace).teams

    expect(team).toMatchObject({ name: 'Design', memberCount: 4 })
    expect(team.id).toBeTruthy()
  })

  test('keeps board columns so progress can be derived from them', () => {
    const [board] = normalizeWorkspace(apiWorkspace).boards

    expect(board).toMatchObject({ boardId: 1, name: 'Sprint 24' })
    expect(board.columns).toHaveLength(1)
  })

  test('keeps the demo snapshot shape unchanged', () => {
    const demo = {
      workspaceId: 1,
      name: 'Growth Lab',
      role: 'ADMIN',
      members: ['Aria Patel'],
      teams: [{ id: 't5', name: 'Content', memberCount: 3 }],
      boards: [{ boardId: 4, name: 'Q3 Campaigns', cards: 22, done: 9 }],
    }

    expect(normalizeWorkspace(demo)).toEqual(demo)
  })

  test('omits card counters a board never carried', () => {
    const [board] = normalizeWorkspace(apiWorkspace).boards

    expect(board).not.toHaveProperty('cards')
    expect(board).not.toHaveProperty('done')
  })

  test('degrades to empty lists rather than throwing on a sparse payload', () => {
    const result = normalizeWorkspace({}, 3)

    expect(result).toEqual({
      workspaceId: 3,
      name: 'Untitled workspace',
      role: 'MEMBER',
      members: [],
      teams: [],
      boards: [],
    })
  })
})

describe('relativeTime', () => {
  test('returns an em dash when there is no timestamp', () => {
    expect(relativeTime(null)).toBe('—')
  })

  test('describes the last minute as just now', () => {
    expect(relativeTime(Date.now())).toBe('just now')
  })

  test('counts in minutes, then hours, then days', () => {
    const minute = 60_000
    expect(relativeTime(Date.now() - 5 * minute)).toBe('5m ago')
    expect(relativeTime(Date.now() - 180 * minute)).toBe('3h ago')
    expect(relativeTime(Date.now() - 60 * 24 * minute)).toBe('yesterday')
    expect(relativeTime(Date.now() - 60 * 24 * 3 * minute)).toBe('3d ago')
  })
})
