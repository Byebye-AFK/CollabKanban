// ── Team derivation ──────────────────────────────────────────
// Teams arrive inside GET /workspace/mine alongside boards, so the
// Teams page reuses getDashboard() rather than asking the server
// separately. Searching, sorting and grouping are shared with the
// Boards page and live in ./library.
//
// What the API gives us per team is a name and a member count
// (TeamResponse is `{teamName, count}`), normalised upstream to
// `{id, name, memberCount}`. There is no team member list and no team
// id in that payload, so this page reports teams rather than editing
// them — see the notes in TeamsPage.

import { filterBy, sortBy } from './library'

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
      workspace,
      workspaceId: workspace.workspaceId,
      workspaceName: workspace.name,
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
