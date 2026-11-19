import { parseApiError } from './apiError'
import { API_BASE_URL } from './config'

// ── Base URL ─────────────────────────────────────────────────
// Set VITE_API_URL to your Spring Boot origin for deployments (see config.js).
const BASE_URL = API_BASE_URL

// ── Helpers ──────────────────────────────────────────────────
async function request(path, options = {}) {
  const token = localStorage.getItem('jwt_token')

  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  })

  // err.status carries the code (callers branch on it — e.g. 409 is an
  // optimistic-lock conflict, handled differently from a generic failure);
  // err.message is now the backend's own message, not a generic string.
  if (!res.ok) throw await parseApiError(res)

  // 204 No Content → return null
  if (res.status === 204) return null

  return res.json()
}

// ── Board ─────────────────────────────────────────────────────

/**
 * GET /board/{boardId}
 * Returns the full board with columns and cards.
 */
export async function getBoard(boardId) {
  return request(`/board/${boardId}`)
}

/**
 * POST /board/create
 * The server treats the team as optional, but every board in the UI
 * belongs to one, so both name and team are checked here first.
 * @param {{ name: string, workspaceId: number, teamId: number, position?: number }} payload
 * @returns {Promise<{ boardId: number, name: string, teamId: number, columns: Array }>}
 */
export async function createBoard({ name, workspaceId, teamId, position = 0 } = {}) {
  const boardName = (name || '').trim()
  if (!boardName) throw new Error('Give the board a name.')
  if (workspaceId == null) throw new Error('Pick a workspace for the board.')
  if (teamId == null) throw new Error('Pick a team for the board.')
  return request('/board/create', {
    method: 'POST',
    body: JSON.stringify({ name: boardName, workspaceId, teamId, position }),
  })
}

// ── Columns ───────────────────────────────────────────────────

/**
 * POST /boards/{boardId}/columns
 * Creates a new column on the board.
 * @param {number} boardId
 * @param {string} name
 * @param {{ boardId: number, name: string, position:number}} columnPayload
 */
export async function createColumn(columnPayload) {
  return request(`/column/create`, {
    method: 'POST',
    body: JSON.stringify(columnPayload),
  })
}
export async function deleteColumn(columnId) {
  
  return request(`/column/${columnId}`, {
    method: 'DELETE',
  })
}



// ── Cards ─────────────────────────────────────────────────────

/**
 * POST /cards
 * Creates a new card in the given column.
 * @param {{ title: string, description: string, columnId: number, assignedTo: number }} payload
 */
export async function createCard(payload) {
  return request(`/card/create`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

/**
 * PUT /card/move/{cardId}
 * Moves a card to a column on the same board.
 * `version` is the card version this client last saw; when sent, the server
 * answers 409 if someone else changed the card since.
 * @param {number} cardId
 * @param {number} targetColumnId
 * @param {number} position
 * @param {number} [version]
 */
export async function moveCard(cardId, targetColumnId, position, version) {
  return request(`/card/move/${cardId}`, {
    method: 'PUT',
    body: JSON.stringify({
      targetColumnId,
      position,
      ...(version != null ? { version } : {}),
    }),
  })
}
/**
 * DELETE /cards/{cardId}
 * Permanently deletes a card.
 * @param {number} cardId
 */
export async function deleteCard(cardId) {
  return request(`/card/${cardId}`, { method: 'DELETE' })
}
