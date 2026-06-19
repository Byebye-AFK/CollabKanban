// ── Base URL ─────────────────────────────────────────────────
// Change this to your Spring Boot server origin in production.
// In development, Vite proxies /board, /boards, /cards → localhost:8080
const BASE_URL = 'http://localhost:8080'

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

  if (!res.ok) {
    const text = await res.text().catch(() => 'Unknown error')
    throw new Error(`API ${res.status}: ${text}`)
  }

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
  console.log("CAlled delete Column")
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
  console.log(JSON.stringify(payload))
  return request(`/card/create`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

/**
 * PATCH /cards/{cardId}/move
 * Moves a card to a different column.
 * @param {number} cardId
 * @param {number} targetColumnId
 */
export async function moveCard(
  cardId,
  targetColumnId,
  position
) {
  return request(`/card/move/${cardId}`, {
    method: 'PUT',
    body: JSON.stringify({
      targetColumnId,
      position,
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
