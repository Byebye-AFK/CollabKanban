// ── Dashboard data ───────────────────────────────────────────
// The Spring backend currently exposes only /board/{id}, /workspace/create
// and /member/addmembership — there is no "list my workspaces" endpoint yet.
// getDashboard() therefore tries the (future) endpoint first and falls back to
// a locally generated demo snapshot so the UI is fully explorable today.
//
// When GET /workspace/mine lands, it should return the `workspaces` shape below
// and everything on this page starts rendering live data with no UI changes.

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
const HOUR = 3600_000

function demoWorkspaces() {
  return [
    {
      workspaceId: 1,
      name: 'Product Core',
      role: 'OWNER',
      progress: 72,
      lastActive: Date.now() - 2 * HOUR,
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
      progress: 45,
      lastActive: Date.now() - 26 * HOUR,
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
      progress: 90,
      lastActive: Date.now() - 5 * HOUR,
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
      progress: 38,
      lastActive: Date.now() - 74 * HOUR,
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
  const openCards = workspaces.reduce(
    (n, w) => n + w.boards.reduce((m, b) => m + (b.cards - b.done), 0),
    0,
  )

  const lastVisitedBoard = recent[0] || null
  const lastWorkspace =
    [...workspaces].sort((a, b) => b.lastActive - a.lastActive)[0] || null

  return { teamCount, boardCount, openCards, lastWorkspace, lastVisitedBoard }
}

/**
 * Loads everything the dashboard renders.
 * @returns {Promise<{workspaces: Array, stats: Object, live: boolean}>}
 */
export async function getDashboard() {
  let workspaces
  let live = true
  try {
    workspaces = await request('/workspace/mine')
    if (!Array.isArray(workspaces) || workspaces.length === 0) throw new Error('empty')
  } catch {
    workspaces = demoWorkspaces()
    live = false
  }
  const recent = getRecent()
  return { workspaces, stats: summarise(workspaces, recent), live }
}
