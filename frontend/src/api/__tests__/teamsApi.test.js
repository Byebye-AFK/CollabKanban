import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  flattenTeams,
  largestTeam,
  sortTeams,
  filterTeams,
  canManageTeam,
  availableMembers,
  addTeamMembers,
  teamHomes,
  createTeam,
  teamForBoard,
  withTeamMembers,
} from '../teamsApi'

const workspaces = [
  {
    workspaceId: 2,
    name: 'Growth Lab',
    role: 'ADMIN',
    teams: [{ id: 't5', name: 'Content', memberCount: 3 }],
    boards: [],
  },
  {
    workspaceId: 1,
    name: 'Product Core',
    role: 'OWNER',
    teams: [
      { id: 't1', name: 'Design', memberCount: 4 },
      { id: 't2', name: 'Backend', memberCount: 6 },
    ],
    boards: [],
  },
]

describe('flattenTeams', () => {
  test('returns one entry per team across every workspace', () => {
    expect(flattenTeams(workspaces).map(t => t.name)).toEqual(['Content', 'Design', 'Backend'])
  })

  test('carries the workspace context each card needs to stand alone', () => {
    const [first] = flattenTeams(workspaces)

    expect(first).toMatchObject({
      name: 'Content',
      memberCount: 3,
      workspaceId: 2,
      workspaceName: 'Growth Lab',
      role: 'ADMIN',
    })
    expect(first.workspace).toBe(workspaces[0])
  })

  test('defaults a missing member count to zero rather than undefined', () => {
    const [team] = flattenTeams([{ workspaceId: 9, name: 'W', role: 'MEMBER', teams: [{ id: 'x', name: 'T' }] }])

    expect(team.memberCount).toBe(0)
  })

  test('returns an empty list for no workspaces', () => {
    expect(flattenTeams()).toEqual([])
    expect(flattenTeams([])).toEqual([])
  })

  test('skips a workspace carrying no teams array', () => {
    expect(flattenTeams([{ workspaceId: 9, name: 'Empty' }])).toEqual([])
  })
})

describe('largestTeam', () => {
  test('returns the biggest member count', () => {
    expect(largestTeam(flattenTeams(workspaces))).toBe(6)
  })

  test('never returns zero, so it is always safe to divide by', () => {
    expect(largestTeam([])).toBe(1)
    expect(largestTeam([{ memberCount: 0 }])).toBe(1)
    expect(largestTeam()).toBe(1)
  })
})

describe('sortTeams', () => {
  const teams = flattenTeams(workspaces)

  test('sorts by name A–Z', () => {
    expect(sortTeams(teams, 'name').map(t => t.name)).toEqual(['Backend', 'Content', 'Design'])
  })

  test('sorts by member count, largest first', () => {
    expect(sortTeams(teams, 'members').map(t => t.memberCount)).toEqual([6, 4, 3])
  })

  test('breaks a member-count tie by name', () => {
    const tied = [
      { name: 'Zulu', memberCount: 2, workspaceName: 'W' },
      { name: 'Alpha', memberCount: 2, workspaceName: 'W' },
    ]
    expect(sortTeams(tied, 'members').map(t => t.name)).toEqual(['Alpha', 'Zulu'])
  })

  test('sorts by workspace, then by team name within it', () => {
    expect(sortTeams(teams, 'workspace').map(t => t.name)).toEqual(['Content', 'Backend', 'Design'])
  })

  test('falls back to name order for an unknown sort id', () => {
    expect(sortTeams(teams, 'nonsense').map(t => t.name)).toEqual(sortTeams(teams, 'name').map(t => t.name))
  })

  test('returns a new array and leaves the input untouched', () => {
    const original = [...teams]
    const sorted = sortTeams(teams, 'members')

    expect(sorted).not.toBe(teams)
    expect(teams).toEqual(original)
  })
})

describe('filterTeams', () => {
  const teams = flattenTeams(workspaces)

  test('matches on team name, ignoring case', () => {
    expect(filterTeams(teams, 'DESIGN').map(t => t.name)).toEqual(['Design'])
  })

  test('matches on workspace name', () => {
    expect(filterTeams(teams, 'growth').map(t => t.name)).toEqual(['Content'])
  })

  test('returns every team for an empty query', () => {
    expect(filterTeams(teams, '')).toBe(teams)
  })

  test('returns an empty array when nothing matches', () => {
    expect(filterTeams(teams, 'zzz')).toEqual([])
  })
})

describe('flattenTeams — membership', () => {
  test('carries the team\'s members and the workspace\'s people', () => {
    const sara = { userId: 11, name: 'Sara Nolan', email: 'sara@example.com' }
    const [team] = flattenTeams([
      { workspaceId: 1, name: 'W', role: 'OWNER', people: [sara], teams: [{ id: 3, name: 'T', members: [sara] }] },
    ])

    expect(team.members).toEqual([sara])
    expect(team.workspacePeople).toEqual([sara])
  })

  test('defaults both lists to empty', () => {
    const [team] = flattenTeams([{ workspaceId: 1, name: 'W', role: 'OWNER', teams: [{ id: 3, name: 'T' }] }])

    expect(team.members).toEqual([])
    expect(team.workspacePeople).toEqual([])
  })
})

describe('canManageTeam', () => {
  test('lets owners and admins manage teams', () => {
    expect(canManageTeam('OWNER')).toBe(true)
    expect(canManageTeam('ADMIN')).toBe(true)
  })

  test('refuses members, viewers and unknown roles', () => {
    expect(canManageTeam('MEMBER')).toBe(false)
    expect(canManageTeam('VIEWER')).toBe(false)
    expect(canManageTeam(undefined)).toBe(false)
  })
})

describe('availableMembers', () => {
  const sara = { userId: 11, name: 'Sara Nolan' }
  const dan = { userId: 12, name: 'Dan Kite' }
  const aria = { userId: 13, name: 'Aria Patel' }

  test('returns workspace people who are not already on the team, sorted by name', () => {
    const team = { members: [sara], workspacePeople: [sara, dan, aria] }

    expect(availableMembers(team)).toEqual([aria, dan])
  })

  test('drops people without an id, since they cannot be submitted', () => {
    const team = { members: [], workspacePeople: [{ userId: null, name: 'Ghost' }, dan] }

    expect(availableMembers(team)).toEqual([dan])
  })

  test('returns an empty list for a team with no workspace people', () => {
    expect(availableMembers({})).toEqual([])
  })
})

describe('addTeamMembers', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
    localStorage.setItem('jwt_token', 'tok')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    localStorage.clear()
  })

  const ok = () => ({ ok: true, status: 200, json: async () => ({}) })
  const fail = (status, message) => ({ ok: false, status, text: async () => JSON.stringify({ message }) })

  test('posts one request per user with the auth header', async () => {
    fetchMock.mockResolvedValue(ok())

    const result = await addTeamMembers(3, [11, 12])

    expect(fetchMock).toHaveBeenCalledTimes(2)
    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toMatch(/\/team\/addMember$/)
    expect(options.method).toBe('POST')
    expect(options.headers.Authorization).toBe('Bearer tok')
    expect(JSON.parse(options.body)).toEqual({ teamId: 3, userId: 11 })
    expect(result).toEqual({ added: [11, 12], failed: [] })
  })

  test('keeps going past a failure and reports it with the server message', async () => {
    fetchMock
      .mockResolvedValueOnce(fail(409, 'Sara Nolan is already on Design'))
      .mockResolvedValueOnce(ok())

    const result = await addTeamMembers(3, [11, 12])

    expect(result).toEqual({
      added: [12],
      failed: [{ userId: 11, message: 'Sara Nolan is already on Design' }],
    })
  })
})

describe('teamHomes', () => {
  test('keeps only workspaces the user owns or admins, sorted by name', () => {
    const homes = teamHomes([
      { workspaceId: 1, name: 'Product Core', role: 'OWNER' },
      { workspaceId: 2, name: 'Growth Lab', role: 'ADMIN' },
      { workspaceId: 3, name: 'Ops', role: 'MEMBER' },
    ])

    expect(homes.map(w => w.workspaceId)).toEqual([2, 1])
  })

  test('skips workspaces without an id to submit', () => {
    expect(teamHomes([{ name: 'Demo', role: 'OWNER' }])).toEqual([])
  })

  test('returns an empty list when given nothing', () => {
    expect(teamHomes()).toEqual([])
  })
})

describe('createTeam', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
    localStorage.setItem('jwt_token', 'tok')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    localStorage.clear()
  })

  test('posts the trimmed name and workspace in the shape the server expects', async () => {
    const created = { teamId: 9, teamName: 'Design', count: 1 }
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => created })

    const result = await createTeam({ name: '  Design  ', workspaceId: 1 })

    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toMatch(/\/team\/add$/)
    expect(options.method).toBe('POST')
    expect(options.headers.Authorization).toBe('Bearer tok')
    expect(JSON.parse(options.body)).toEqual({ teamName: 'Design', workSpaceId: 1 })
    expect(result).toEqual(created)
  })

  test('rejects a blank name without calling the server', async () => {
    await expect(createTeam({ name: '   ', workspaceId: 1 })).rejects.toThrow(/name/i)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  test('rejects a missing workspace without calling the server', async () => {
    await expect(createTeam({ name: 'Design' })).rejects.toThrow(/workspace/i)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  test('surfaces the server message on failure', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 404,
      text: async () => JSON.stringify({ message: 'Workspace is Not found' }),
    })

    await expect(createTeam({ name: 'Design', workspaceId: 1 })).rejects.toThrow('Workspace is Not found')
  })
})

// ── Teams seen from a board ──────────────────────────────────

describe('teamForBoard', () => {
  const sara = { userId: 11, name: 'Sara Nolan' }
  const dan = { userId: 12, name: 'Dan Kite' }
  const workspace = {
    workspaceId: 1,
    name: 'Product Core',
    role: 'OWNER',
    people: [dan],
    teams: [{ id: 7, name: 'Design', memberCount: 1, members: [sara] }],
  }

  test('finds the board\'s team in the shape the add-members dialog reads', () => {
    const team = teamForBoard(workspace, 7)

    expect(team).toMatchObject({
      id: 7,
      name: 'Design',
      members: [sara],
      workspacePeople: [dan],
      workspaceName: 'Product Core',
      role: 'OWNER',
    })
  })

  test('matches ids whether the board sends a number or a string', () => {
    expect(teamForBoard(workspace, '7').id).toBe(7)
  })

  test('returns null when the board has no team', () => {
    expect(teamForBoard(workspace, null)).toBeNull()
    expect(teamForBoard(workspace, undefined)).toBeNull()
  })

  test('returns null when the team is not in this workspace', () => {
    expect(teamForBoard(workspace, 99)).toBeNull()
  })

  test('returns null without a workspace', () => {
    expect(teamForBoard(null, 7)).toBeNull()
  })
})

describe('withTeamMembers', () => {
  const sara = { userId: 11, name: 'Sara Nolan' }
  const dan = { userId: 12, name: 'Dan Kite' }
  const base = {
    workspaceId: 1,
    teams: [
      { id: 7, name: 'Design', memberCount: 1, members: [sara] },
      { id: 8, name: 'QA', memberCount: 0, members: [] },
    ],
  }

  test('appends the people to the team and raises its count', () => {
    const next = withTeamMembers(base, 7, [dan])

    expect(next.teams[0].members).toEqual([sara, dan])
    expect(next.teams[0].memberCount).toBe(2)
  })

  test('returns a new workspace and leaves the original untouched', () => {
    const next = withTeamMembers(base, 7, [dan])

    expect(next).not.toBe(base)
    expect(base.teams[0].members).toEqual([sara])
    expect(base.teams[0].memberCount).toBe(1)
  })

  test('leaves other teams as they were', () => {
    const next = withTeamMembers(base, 7, [dan])

    expect(next.teams[1]).toBe(base.teams[1])
  })

  test('skips people who are already on the team', () => {
    const next = withTeamMembers(base, 7, [sara, dan])

    expect(next.teams[0].members).toEqual([sara, dan])
    expect(next.teams[0].memberCount).toBe(2)
  })

  test('returns the workspace unchanged when there is nothing to add', () => {
    expect(withTeamMembers(base, 7, [])).toBe(base)
  })
})
