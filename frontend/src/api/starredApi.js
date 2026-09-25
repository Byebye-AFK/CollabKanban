// ── Starred boards (persisted locally) ───────────────────────
// The API has no notion of a starred board — no column, no endpoint —
// so a star lives in this browser only, exactly as recently-visited
// boards do in dashboardApi. Swapping this for a server call later
// means changing this file and nothing else.
//
// Every read is guarded: storage can be unavailable or hold something
// another version wrote, and neither should cost the user their page.

export const STARRED_KEY = 'kanban_starred'

/**
 * The ids of every starred board.
 * @returns {Array<number>} always an array, whatever storage holds
 */
export function getStarred() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STARRED_KEY) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/**
 * Stars a board, or unstars it if it already was.
 *
 * Returns a new list rather than editing the old one, so React sees a
 * changed reference and callers holding the previous list keep it.
 *
 * @param {number} boardId
 * @returns {Array<number>} the list after the toggle
 */
export function toggleStar(boardId) {
  const current = getStarred()
  const next = current.includes(boardId)
    ? current.filter(id => id !== boardId)
    : [...current, boardId]

  try {
    localStorage.setItem(STARRED_KEY, JSON.stringify(next))
  } catch { /* storage unavailable — the star is a nicety, never a failure */ }

  return next
}

/**
 * The starred boards, in the order the boards were given.
 * Pure, so the pages can arrange the result however they like.
 */
export function filterStarred(boards = [], starredIds = []) {
  return (boards || []).filter(board => starredIds.includes(board?.boardId))
}
