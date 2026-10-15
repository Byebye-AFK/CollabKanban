// ── Column status ────────────────────────────────────────────
// The API has no notion of a card's status: a card is simply in a
// column, and columns are named by whoever made the board. The board's
// status icons and its All / Active / Backlog views read a status from
// the column name instead. Names are compared after folding case,
// dashes and underscores; anything unrecognised is plain to-do work, so
// a custom column still renders as an ordinary open column.

export const STATUS = Object.freeze({
  BACKLOG: 'backlog',
  TODO: 'todo',
  STARTED: 'started',
  DONE: 'done',
  CANCELED: 'canceled',
})

const NAMES = {
  [STATUS.BACKLOG]: ['backlog', 'icebox', 'someday', 'inbox'],
  [STATUS.TODO]: ['todo', 'to do', 'planned', 'next', 'up next', 'ready'],
  [STATUS.STARTED]: ['in progress', 'doing', 'started', 'wip', 'in review', 'review', 'testing', 'qa'],
  [STATUS.DONE]: ['done', 'complete', 'completed', 'shipped'],
  [STATUS.CANCELED]: ['canceled', 'cancelled', 'duplicate', 'wont do', 'wont fix', 'archived'],
}

function normalise(name) {
  return (name || '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * The status a column's name stands for.
 * @param {string} name
 * @returns {string} one of STATUS
 */
export function columnStatus(name) {
  const key = normalise(name)
  const match = Object.entries(NAMES).find(([, names]) => names.includes(key))
  return match ? match[0] : STATUS.TODO
}

// ── Card keys ────────────────────────────────────────────────
// Linear-style "PR-128" identifiers. The prefix is derived from the
// board name on every render rather than stored, so renaming a board
// renames its keys with it.

const FALLBACK_PREFIX = 'CK'
const PREFIX_LENGTH = 3

/** Up to three capitals: word initials, or the start of a single word. */
export function boardPrefix(name) {
  const words = (name || '').split(/\s+/).filter(w => /^[a-z]/i.test(w))
  if (words.length === 0) return FALLBACK_PREFIX
  const prefix = words.length === 1
    ? words[0].replace(/[^a-z]/gi, '').slice(0, PREFIX_LENGTH)
    : words.slice(0, PREFIX_LENGTH).map(w => w[0]).join('')
  return prefix.toUpperCase()
}

/**
 * The key shown on a card. An optimistic card still carries a temporary
 * string id, so it shows a placeholder until the server numbers it.
 */
export function cardKey(boardName, cardId) {
  const number = Number.isInteger(cardId) ? cardId : '…'
  return `${boardPrefix(boardName)}-${number}`
}

// ── Board views ──────────────────────────────────────────────

export const BOARD_VIEWS = [
  { id: 'all', label: 'All cards' },
  { id: 'active', label: 'Active' },
  { id: 'backlog', label: 'Backlog' },
]

const VIEW_STATUSES = {
  active: [STATUS.TODO, STATUS.STARTED],
  backlog: [STATUS.BACKLOG],
}

/**
 * The columns a view shows, in board order. Unknown views show
 * everything rather than an empty board.
 */
export function filterColumnsByView(columns, view) {
  const list = Array.isArray(columns) ? columns : []
  const statuses = VIEW_STATUSES[view]
  if (!statuses) return [...list]
  return list.filter(col => statuses.includes(columnStatus(col?.name)))
}
