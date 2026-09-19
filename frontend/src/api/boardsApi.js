// ── Board derivation ─────────────────────────────────────────
// Pure functions over the normalised workspace list. No fetching here:
// boards arrive inside GET /workspace/mine, so the boards page reuses
// getDashboard() rather than asking the server twice.
//
// Searching, sorting and grouping are shared with the Teams page and
// live in ./library; only the board-specific comparators and progress
// derivation are here.

import { filterBy, sortBy } from './library'

/**
 * Column names treated as "finished" when deriving progress.
 *
 * Compared case-insensitively and never written back — column names
 * belong to whoever made the board. A board whose columns match none of
 * these simply reports `done: 0`, which the UI renders as a full ring of
 * outstanding work rather than as an error.
 */
const DONE_COLUMN_NAMES = ['done', 'complete', 'completed', 'shipped']

function isDoneColumn(column) {
  return DONE_COLUMN_NAMES.includes((column?.name || '').trim().toLowerCase())
}

function countCards(column) {
  return Array.isArray(column?.cards) ? column.cards.length : 0
}

/**
 * Card totals for one board, from whichever shape the payload carried.
 *
 * `known: false` means the payload told us nothing about cards — the UI
 * shows a column count instead of inventing a number.
 *
 * @param {{columns?: Array, cards?: number, done?: number}} board
 * @returns {{known: boolean, total: number, done: number, columnCount: number}}
 */
export function boardProgress(board) {
  if (Array.isArray(board?.columns)) {
    const columns = board.columns
    return {
      known: true,
      total: columns.reduce((n, c) => n + countCards(c), 0),
      done: columns.filter(isDoneColumn).reduce((n, c) => n + countCards(c), 0),
      columnCount: columns.length,
    }
  }

  // Demo snapshot shape — explicit counters, nothing inferred.
  if (typeof board?.cards === 'number') {
    return {
      known: true,
      total: board.cards,
      done: typeof board.done === 'number' ? board.done : 0,
      columnCount: 0,
    }
  }

  return { known: false, total: 0, done: 0, columnCount: 0 }
}

/** Percentage of a board's cards that sit in a done column, 0 when empty. */
export function progressPercent(progress) {
  if (!progress?.known || progress.total === 0) return 0
  return Math.round((progress.done / progress.total) * 100)
}

/**
 * Flattens every workspace's boards into one list, each board carrying
 * the workspace context the card needs to stand on its own.
 *
 * @param {Array} workspaces normalised workspaces
 * @param {Array} recent entries from getRecent(), newest first
 * @returns {Array} one entry per board
 */
export function flattenBoards(workspaces = [], recent = []) {
  const visitedAt = new Map(recent.map(r => [r.boardId, r.at]))

  return workspaces.flatMap(workspace =>
    (workspace.boards || []).map(board => ({
      boardId: board.boardId,
      name: board.name,
      workspace,
      workspaceId: workspace.workspaceId,
      workspaceName: workspace.name,
      members: workspace.members || [],
      role: workspace.role,
      progress: boardProgress(board),
      lastVisitedAt: visitedAt.get(board.boardId) ?? null,
    })),
  )
}

export const SORTS = [
  { id: 'name', label: 'Name (A–Z)' },
  { id: 'cards', label: 'Most cards' },
  { id: 'workspace', label: 'Workspace' },
  { id: 'recent', label: 'Recently opened' },
]

const COMPARATORS = {
  name: (a, b) => a.name.localeCompare(b.name),
  cards: (a, b) => b.progress.total - a.progress.total,
  workspace: (a, b) =>
    a.workspaceName.localeCompare(b.workspaceName) || a.name.localeCompare(b.name),
  // Never-opened boards sort last rather than jumping to the front.
  recent: (a, b) => (b.lastVisitedAt ?? -Infinity) - (a.lastVisitedAt ?? -Infinity),
}

/** Returns a new sorted array — the input is never reordered in place. */
export function sortBoards(boards = [], sortId = 'name') {
  return sortBy(boards, COMPARATORS, sortId, 'name')
}

/** Case-insensitive match across board name and workspace name. */
export function filterBoards(boards = [], query = '') {
  return filterBy(boards, query, ['name', 'workspaceName'])
}
