import { describe, test, expect } from 'vitest'
import { flattenTeams, largestTeam, sortTeams, filterTeams } from '../teamsApi'

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
