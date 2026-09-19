// ── Dashboard data ───────────────────────────────────────────
// GET /workspace/mine returns every workspace the caller belongs to,
// each carrying its teams, members and boards. Its DTO shape differs
// from what the components read, so normalizeWorkspace() below maps it
// once at the boundary.
//
// When the call fails — server down, no token, empty result — we fall
// back to a local demo snapshot and flag `live: false`, so the UI stays
// explorable and says plainly that it is showing sample data.

import { boardProgress } from './boardsApi'

const BASE_URL = 'http://localhost:8080'

async function request(path) {
  const token = localStorage.getItem('jwt_token')
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json()
}

// ── Recently visited (persisted locally) ─────────────────────
const RECENT_KEY = 'kanban_recent'

export function rememberVisit(entry) {
  try {
    const prev = getRecent()
    const next = [{ ...entry, at: Date.now() }, ...prev.filter(r => r.boardId !== entry.boardId)]
    localStorage.setItem(RECENT_KEY, JSON.stringify(next.slice(0, 8)))
  } catch { /* storage unavailable — recents are a nicety, never a failure */ }
}

export function getRecent() {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]')
  } catch {
    return []
  }
}

export function relativeTime(ts) {
  if (!ts) return '—'
  const mins = Math.round((Date.now() - ts) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.round(hrs / 24)
  return days === 1 ? 'yesterday' : `${days}d ago`
}

// ── Demo snapshot ────────────────────────────────────────────
function demoWorkspaces() {
  return [
    {
      workspaceId: 1,
      name: 'Product Core',
      role: 'OWNER',
      members: ['Sara Nolan', 'Dan Kite', 'Aria Patel', 'Miles Fox'],
      teams: [
        { id: 't1', name: 'Design', memberCount: 4 },
        { id: 't2', name: 'Frontend', memberCount: 6 },
        { id: 't3', name: 'Backend', memberCount: 5 },
        { id: 't4', name: 'QA', memberCount: 3 },
      ],
      boards: [
        { boardId: 1, name: 'Sprint 24', cards: 34, done: 24 },
        { boardId: 2, name: 'Roadmap', cards: 18, done: 11 },
        { boardId: 3, name: 'Bugs', cards: 27, done: 20 },
      ],
    },
    {
      workspaceId: 2,
      name: 'Growth Lab',
      role: 'ADMIN',
      members: ['Aria Patel', 'Leo Brand', 'Sara Nolan'],
      teams: [
        { id: 't5', name: 'Content', memberCount: 3 },
        { id: 't6', name: 'Paid Ads', memberCount: 2 },
        { id: 't7', name: 'Analytics', memberCount: 4 },
      ],
      boards: [
        { boardId: 4, name: 'Q3 Campaigns', cards: 22, done: 9 },
        { boardId: 5, name: 'Experiments', cards: 14, done: 7 },
      ],
    },
    {
      workspaceId: 3,
      name: 'Platform Ops',
      role: 'MEMBER',
      members: ['Miles Fox', 'Dan Kite'],
      teams: [
        { id: 't8', name: 'Infra', memberCount: 4 },
        { id: 't9', name: 'On-call', memberCount: 5 },
      ],
      boards: [
        { boardId: 6, name: 'Incidents', cards: 12, done: 11 },
        { boardId: 7, name: 'Migrations', cards: 9, done: 8 },
      ],
    },
    {
      workspaceId: 4,
      name: 'Design System',
      role: 'MEMBER',
      members: ['Sara Nolan', 'Aria Patel', 'Nina Cole'],
      teams: [
        { id: 't10', name: 'Tokens', memberCount: 2 },
        { id: 't11', name: 'Components', memberCount: 4 },
      ],
      boards: [{ boardId: 8, name: 'v2 Rollout', cards: 16, done: 6 }],
    },
  ]
}

function summarise(workspaces, recent) {
  const teamCount = workspaces.reduce((n, w) => n + w.teams.length, 0)
  const boardCount = workspaces.reduce((n, w) => n + w.boards.length, 0)
  // Derived rather than read off the board: live boards carry columns,
  // demo boards carry counters, and a board may report neither. Reading
  // `b.cards - b.done` directly turned the whole tile into NaN the
  // moment one board lacked them.
  const openCards = workspaces.reduce(
    (n, w) =>
      n +
      w.boards.reduce((m, b) => {
        const progress = boardProgress(b)
        return m + (progress.total - progress.done)
      }, 0),
    0,
  )

  const lastVisitedBoard = recent[0] || null
  const lastWorkspace = workspaces[0] || null

  return { teamCount, boardCount, openCards, lastWorkspace, lastVisitedBoard }
}

// ── Normalisation ────────────────────────────────────────────
// The Spring DTOs and the shape this UI reads have drifted apart:
// WorkSpaceResponse sends `workSpaceId`, members as objects and teams
// as `{teamName, count}`. Normalising once, here at the boundary, keeps
// every component reading one shape and means a future DTO change is a
// one-file fix rather than a hunt through the render tree.
//
// Everything is guarded: an unexpected shape degrades to an empty list
// rather than throwing halfway through a render.

/** Pulls a display name out of either a UserResponse or a bare string. */
function memberName(member) {
  if (typeof member === 'string') return member
  return member?.userName || member?.name || member?.userEmail || 'Unknown'
}

function normalizeTeam(team, index) {
  return {
    id: team?.id ?? team?.teamId ?? `t${index}-${team?.teamName || team?.name || index}`,
    name: team?.teamName || team?.name || 'Untitled team',
    memberCount: team?.count ?? team?.memberCount ?? 0,
  }
}

/**
 * Boards keep whatever card information the payload carried: `columns`
 * from the live API, or the explicit `cards`/`done` counters the demo
 * snapshot supplies. boardsApi derives progress from whichever is there.
 */
function normalizeBoard(board) {
  return {
    boardId: board?.boardId ?? board?.id,
    name: board?.name || 'Untitled board',
    ...(Array.isArray(board?.columns) ? { columns: board.columns } : {}),
    ...(typeof board?.cards === 'number' ? { cards: board.cards } : {}),
    ...(typeof board?.done === 'number' ? { done: board.done } : {}),
  }
}

/** Maps one API workspace onto the shape every component reads. */
export function normalizeWorkspace(workspace, index = 0) {
  return {
    workspaceId: workspace?.workspaceId ?? workspace?.workSpaceId ?? index,
    name: workspace?.name || 'Untitled workspace',
    role: workspace?.role || 'MEMBER',
    members: (workspace?.members || []).map(memberName),
    teams: (workspace?.teams || []).map(normalizeTeam),
    boards: (workspace?.boards || []).map(normalizeBoard),
  }
}

/**
 * Loads everything the dashboard renders.
 * @returns {Promise<{workspaces: Array, stats: Object, live: boolean}>}
 */
export async function getDashboard() {
  let workspaces
  let live = true
  try {
    const payload = await request('/workspace/mine')
    if (!Array.isArray(payload) || payload.length === 0) throw new Error('empty')
    workspaces = payload.map(normalizeWorkspace)
  } catch {
    workspaces = demoWorkspaces().map(normalizeWorkspace)
    live = false
  }
  const recent = getRecent()
  return { workspaces, stats: summarise(workspaces, recent), live }
}
