// ── Teams ────────────────────────────────────────────────────
// Teams arrive inside GET /workspace/mine alongside boards, so the
// Teams page reuses getDashboard() rather than asking the server
// separately. Searching, sorting and grouping are shared with the
// Boards page and live in ./library.
//
// Per team the payload carries an id, a name, a member count and the
// members themselves; per workspace, the people who belong to it
// (normalised upstream to `{userId, name, email}`). Together those are
// enough to offer "add from this workspace" — POST /team/addMember
// takes one `{teamId, userId}` at a time.

import { filterBy, sortBy } from './library'
import { parseApiError } from './apiError'

const BASE_URL = 'http://localhost:8080'

/** Roles the server lets change a team's membership. */
const TEAM_MANAGER_ROLES = ['OWNER', 'ADMIN']

/**
 * Flattens every workspace's teams into one list, each team carrying
 * the workspace context the card needs to stand on its own.
 *
 * @param {Array} workspaces normalised workspaces
 * @returns {Array} one entry per team
 */
export function flattenTeams(workspaces = []) {
  return workspaces.flatMap(workspace =>
    (workspace.teams || []).map(team => ({
      id: team.id,
      name: team.name,
      memberCount: team.memberCount ?? 0,
      members: team.members || [],
      workspace,
      workspaceId: workspace.workspaceId,
      workspaceName: workspace.name,
      workspacePeople: workspace.people || [],
      role: workspace.role,
    })),
  )
}

/**
 * The largest team in the list, used to scale the member meter so the
 * bars compare teams against each other rather than against a made-up
 * ceiling. Never zero, so it is always safe to divide by.
 */
export function largestTeam(teams = []) {
  return Math.max(1, ...teams.map(t => t.memberCount ?? 0))
}

export const SORTS = [
  { id: 'name', label: 'Name (A–Z)' },
  { id: 'members', label: 'Most members' },
  { id: 'workspace', label: 'Workspace' },
]

const COMPARATORS = {
  name: (a, b) => a.name.localeCompare(b.name),
  members: (a, b) => b.memberCount - a.memberCount || a.name.localeCompare(b.name),
  workspace: (a, b) =>
    a.workspaceName.localeCompare(b.workspaceName) || a.name.localeCompare(b.name),
}

/** Returns a new sorted array — the input is never reordered in place. */
export function sortTeams(teams = [], sortId = 'name') {
  return sortBy(teams, COMPARATORS, sortId, 'name')
}

/** Case-insensitive match across team name and workspace name. */
export function filterTeams(teams = [], query = '') {
  return filterBy(teams, query, ['name', 'workspaceName'])
}

// ── Membership ───────────────────────────────────────────────

/** Mirrors the server's check, so the UI only offers what will succeed. */
export function canManageTeam(role) {
  return TEAM_MANAGER_ROLES.includes(role)
}

/**
 * Workspace people who could join this team: not already on it, and
 * carrying a real id to submit. Sorted by name for scanning.
 */
export function availableMembers(team = {}) {
  const onTeam = new Set((team.members || []).map(m => m.userId))
  return (team.workspacePeople || [])
    .filter(person => person.userId != null && !onTeam.has(person.userId))
    .sort((a, b) => a.name.localeCompare(b.name))
}

async function postJson(path, body) {
  const token = localStorage.getItem('jwt_token')
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw await parseApiError(res)
  return res.json()
}

function addTeamMember(teamId, userId) {
  return postJson('/team/addMember', { teamId, userId })
}

/**
 * Adds each user in turn. One failure does not stop the rest, so the
 * caller can report exactly who made it and who did not.
 *
 * @returns {Promise<{added: number[], failed: {userId: number, message: string}[]}>}
 */
export async function addTeamMembers(teamId, userIds = []) {
  const added = []
  const failed = []
  for (const userId of userIds) {
    try {
      await addTeamMember(teamId, userId)
      added.push(userId)
    } catch (err) {
      failed.push({ userId, message: err.message || 'Could not add this member.' })
    }
  }
  return { added, failed }
}

// ── Teams seen from a board ──────────────────────────────────
// A board carries only its `teamId`. The team's members and the
// workspace's people are already in the workspace the board was opened
// from, so the board resolves them locally instead of fetching again.

/**
 * The team a board belongs to, in the same shape `flattenTeams` yields
 * so the add-members dialog works on it unchanged. Ids are compared as
 * strings: a board sends a number, the demo snapshot uses strings.
 *
 * @returns {object|null} null when the board has no team, or the team
 *   is not in this workspace
 */
export function teamForBoard(workspace, teamId) {
  if (!workspace || teamId == null) return null
  return flattenTeams([workspace]).find(t => String(t.id) === String(teamId)) ?? null
}

/**
 * The workspace with `people` appended to one team, without mutating the
 * input. Already-present people are skipped, so a retry cannot list
 * someone twice. Returns the same workspace when nothing is new.
 */
export function withTeamMembers(workspace, teamId, people = []) {
  const team = (workspace?.teams || []).find(t => String(t.id) === String(teamId))
  if (!team) return workspace

  const onTeam = new Set((team.members || []).map(m => m.userId))
  const fresh = people.filter(p => !onTeam.has(p.userId))
  if (fresh.length === 0) return workspace

  return {
    ...workspace,
    teams: workspace.teams.map(t =>
      t === team
        ? { ...t, members: [...(t.members || []), ...fresh], memberCount: (t.memberCount ?? 0) + fresh.length }
        : t,
    ),
  }
}

// ── Creating teams ───────────────────────────────────────────
// POST /team/add takes `{teamName, workSpaceId}` (the server's
// spelling) and adds the caller as the team's first member. The server
// does not check the caller's role, so the UI only offers workspaces
// the user owns or admins: the same rule as adding members, so a new
// team is never one its creator cannot then staff.

/** Workspaces the user may create a team in, sorted by name. */
export function teamHomes(workspaces = []) {
  return workspaces
    .filter(w => w.workspaceId != null && canManageTeam(w.role))
    .sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * Creates a team inside a workspace. Validated here because the server
 * would happily store a blank name.
 *
 * @returns {Promise<{teamId: number, teamName: string, count: number}>}
 */
export async function createTeam({ name, workspaceId } = {}) {
  const teamName = (name || '').trim()
  if (!teamName) throw new Error('Give the team a name.')
  if (workspaceId == null) throw new Error('Pick a workspace for the team.')
  return postJson('/team/add', { teamName, workSpaceId: workspaceId })
}
