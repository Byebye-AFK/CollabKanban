import { describe, test, expect, vi, afterEach } from 'vitest'
import { normalizeWorkspace, relativeTime, withBoard } from '../dashboardApi'

/** Exactly the shape Spring's WorkSpaceResponse serialises. */
const apiWorkspace = {
  workSpaceId: 7,
  name: 'Product Core',
  role: 'OWNER',
  members: [
    { userId: 11, userName: 'Sara Nolan', userEmail: 'sara@example.com' },
    { userId: 12, userName: 'Dan Kite', userEmail: 'dan@example.com' },
  ],
  teams: [
    {
      teamId: 3,
      teamName: 'Design',
      count: 4,
      members: [{ userId: 11, userName: 'Sara Nolan', userEmail: 'sara@example.com' }],
    },
  ],
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

  test('keeps each member\'s id alongside their name as people', () => {
    expect(normalizeWorkspace(apiWorkspace).people).toEqual([
      { userId: 11, name: 'Sara Nolan', email: 'sara@example.com' },
      { userId: 12, name: 'Dan Kite', email: 'dan@example.com' },
    ])
  })

  test('gives plain string members a null id, so they can never be submitted', () => {
    const ws = { ...apiWorkspace, members: ['Aria Patel'] }

    expect(normalizeWorkspace(ws).people).toEqual([{ userId: null, name: 'Aria Patel', email: null }])
  })

  test('maps a team\'s members onto people', () => {
    const [team] = normalizeWorkspace(apiWorkspace).teams

    expect(team.id).toBe(3)
    expect(team.members).toEqual([{ userId: 11, name: 'Sara Nolan', email: 'sara@example.com' }])
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

    expect(normalizeWorkspace(demo)).toMatchObject(demo)
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
      people: [],
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

// Each test loads a fresh copy of the module, since the cache is
// module state and must start empty.
describe('getCachedWorkspaces', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  const loadFresh = async () => {
    vi.resetModules()
    return import('../dashboardApi')
  }

  test('is empty before the dashboard has loaded', async () => {
    const api = await loadFresh()

    expect(api.getCachedWorkspaces()).toEqual([])
  })

  test('holds the workspaces from the last load', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [apiWorkspace] }))
    const api = await loadFresh()

    await api.getDashboard()

    expect(api.getCachedWorkspaces().map(w => w.name)).toEqual(['Product Core'])
  })

  test('holds the sample workspaces when the load fell back to them', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    vi.spyOn(console, 'log').mockImplementation(() => {})
    const api = await loadFresh()

    const { workspaces } = await api.getDashboard()

    expect(api.getCachedWorkspaces()).toEqual(workspaces)
  })
})

describe('withBoard', () => {
  const workspaces = [
    { workspaceId: 7, name: 'Backend Team', boards: [{ boardId: 1, name: 'First Board' }] },
    { workspaceId: 8, name: 'Growth', boards: [] },
  ]

  test('appends a normalised board to the matching workspace only', () => {
    const next = withBoard(workspaces, 7, { boardId: 9, name: 'Sprint 25', teamId: 4, columns: [] })

    expect(next[0].boards).toEqual([
      { boardId: 1, name: 'First Board' },
      { boardId: 9, name: 'Sprint 25', teamId: 4, columns: [] },
    ])
    expect(next[1]).toBe(workspaces[1])
  })

  test('does not mutate the input', () => {
    withBoard(workspaces, 7, { boardId: 9, name: 'Sprint 25' })

    expect(workspaces[0].boards).toHaveLength(1)
  })
})

describe('normalizeWorkspace boards', () => {
  test('keeps the team a board belongs to', () => {
    const ws = normalizeWorkspace({ boards: [{ boardId: 1, name: 'A', teamId: 3 }] })

    expect(ws.boards[0].teamId).toBe(3)
  })
})

describe('cacheWorkspace', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  test('replaces the cached workspace with the same id', async () => {
    vi.resetModules()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ workSpaceId: 7, name: 'A' }, { workSpaceId: 8, name: 'B' }]),
    }))
    const api = await import('../dashboardApi')
    await api.getDashboard()
    const [, other] = api.getCachedWorkspaces()

    api.cacheWorkspace({ workspaceId: 7, name: 'A2' })

    expect(api.getCachedWorkspaces()[0].name).toBe('A2')
    expect(api.getCachedWorkspaces()[1]).toBe(other)
  })
})
