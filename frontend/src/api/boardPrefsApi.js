// ── Board view preferences (persisted locally) ───────────────
// Which columns are tucked into the "Hidden columns" panel, and how
// cards are displayed. These are how one person likes to look at a
// board, not facts about the board, so they live in this browser only,
// like stars do in starredApi.
//
// Every read is guarded: storage can be unavailable or hold something
// another version wrote, and neither should cost the user their board.

export const HIDDEN_KEY = 'kanban_hidden_columns'
export const DISPLAY_KEY = 'kanban_board_display'

export const DEFAULT_DISPLAY = Object.freeze({
  showDescriptions: true,
  showEmptyColumns: true,
})

function read(key, fallback) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key))
    return parsed ?? fallback
  } catch {
    return fallback
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch { /* storage unavailable — a preference is a nicety, never a failure */ }
}

// ── Hidden columns ───────────────────────────────────────────

function readHiddenMap() {
  const map = read(HIDDEN_KEY, {})
  return map && typeof map === 'object' && !Array.isArray(map) ? map : {}
}

/** Ids of the columns hidden on one board. */
export function getHidden(boardId) {
  const ids = readHiddenMap()[boardId]
  return Array.isArray(ids) ? ids : []
}

/**
 * Hides a column, or shows it again if it was hidden.
 * Returns the board's new list; the earlier one is left as it was.
 */
export function toggleHidden(boardId, columnId) {
  const map = readHiddenMap()
  const current = Array.isArray(map[boardId]) ? map[boardId] : []
  const next = current.includes(columnId)
    ? current.filter(id => id !== columnId)
    : [...current, columnId]

  write(HIDDEN_KEY, { ...map, [boardId]: next })
  return next
}

/** Splits a board's columns into the shown and hidden sets, keeping board order. */
export function partitionColumns(columns, hiddenIds) {
  const list = Array.isArray(columns) ? columns : []
  const hidden = Array.isArray(hiddenIds) ? hiddenIds : []
  return {
    shown: list.filter(col => !hidden.includes(col.columnId)),
    hidden: list.filter(col => hidden.includes(col.columnId)),
  }
}

// ── Display options ──────────────────────────────────────────

/** Display options, with anything unknown or malformed dropped back to its default. */
export function getDisplay() {
  const stored = read(DISPLAY_KEY, {})
  return Object.fromEntries(
    Object.entries(DEFAULT_DISPLAY).map(([key, fallback]) => [
      key,
      typeof stored?.[key] === 'boolean' ? stored[key] : fallback,
    ])
  )
}

/** Merges a change over the current options, persists it and returns the result. */
export function setDisplay(change) {
  const next = { ...getDisplay(), ...change }
  write(DISPLAY_KEY, next)
  return next
}
