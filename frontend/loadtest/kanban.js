// ── Load test: how many concurrent users can the backend handle? ───────────
// Run:  k6 run loadtest/kanban.js            (backend on :8080)
// Each VU = one user: signs up + logs in once, then works a board in a loop.
// All test data uses the "loadtest_" email prefix so it can be deleted later.
import http from 'k6/http'
import { check, sleep } from 'k6'
import { Trend } from 'k6/metrics'

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080'
const PEAK_USERS = Number(__ENV.PEAK || 200)
// Card create requires an existing user id (backend 500s without one). Pass ASSIGNEE_ID=<real user id>.
const ASSIGNEE_ID = Number(__ENV.ASSIGNEE_ID || 1)
const THINK_TIME_SECONDS = 1
const RUN_ID = Date.now()

const loginTime = new Trend('login_duration', true)

// ── Load shape ─────────────────────────────────────────────────────────────
// Ramp in steps so the knee (where latency/errors jump) is visible per stage.
export const options = {
  stages: [
    { duration: '30s', target: Math.round(PEAK_USERS * 0.1) },
    { duration: '1m', target: Math.round(PEAK_USERS * 0.25) },
    { duration: '1m', target: Math.round(PEAK_USERS * 0.5) },
    { duration: '1m', target: PEAK_USERS },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],
    'http_req_duration{kind:board}': ['p(95)<500'],
  },
}

const jsonHeaders = (token) => ({
  'Content-Type': 'application/json',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
})

const post = (path, body, token, kind) =>
  http.post(`${BASE_URL}${path}`, JSON.stringify(body), {
    headers: jsonHeaders(token),
    tags: { kind },
  })

// ── Per-user setup (runs once per VU) ──────────────────────────────────────
function onboard() {
  const email = `loadtest_${RUN_ID}_${__VU}@example.com`
  const password = 'LoadTest#123'

  post('/user/add', { name: `loadtest_${__VU}`, email, password }, null, 'auth')

  const started = Date.now()
  const login = post('/user/login', { email, password }, null, 'auth')
  loginTime.add(Date.now() - started)
  if (login.status !== 200) return null
  const token = login.body

  const ws = post('/workspace/create', { name: `lt-ws-${__VU}` }, token, 'setup')
  const workspaceId = ws.json('workspaceId')
  const board = post('/board/create', { name: 'lt-board', workspaceId, position: 1 }, token, 'setup')
  const boardId = board.json('boardId')
  post('/column/create', { name: 'To do', boardId, position: 1 }, token, 'setup')
  post('/column/create', { name: 'Done', boardId, position: 2 }, token, 'setup')

  // Column/card create responses return null ids (read before save), so read ids from the board.
  const full = http.get(`${BASE_URL}/board/${boardId}`, { headers: jsonHeaders(token), tags: { kind: 'setup', name: 'GET /board/{id}' } })
  const todoId = full.json('columns.#(name=="To do").columnId')
  const doneId = full.json('columns.#(name=="Done").columnId')
  if (!todoId || !doneId) return null

  return { token, boardId, todoId, doneId }
}

let session = null

// ── Steady-state activity: what a user does on a board ─────────────────────
export default function () {
  session = session || onboard()
  if (!session) {
    sleep(THINK_TIME_SECONDS)
    return
  }
  const { token, boardId, todoId, doneId } = session

  const board = http.get(`${BASE_URL}/board/${boardId}`, {
    headers: jsonHeaders(token),
    tags: { kind: 'board', name: 'GET /board/{id}' },
  })
  check(board, { 'board 200': (r) => r.status === 200 })

  const card = post(
    '/card/create',
    { title: 'task', description: 'x', columnId: todoId, assignedTo: ASSIGNEE_ID },
    token,
    'write',
  )
  check(card, { 'card create 200': (r) => r.status === 200 })

  // The create response returns cardId: null (it is read before save), so find the new card
  // the way the UI does: refetch the board.
  const after = http.get(`${BASE_URL}/board/${boardId}`, { headers: jsonHeaders(token), tags: { kind: 'board', name: 'GET /board/{id}' } })
  const todoCards = after.json(`columns.#(columnId==${todoId}).cards`) || []
  const cardId = todoCards.length ? todoCards[todoCards.length - 1].cardId : null

  if (cardId) {
    const move = http.put(
      `${BASE_URL}/card/move/${cardId}`,
      JSON.stringify({ boardId, targetColumnId: doneId, position: 1 }),
      { headers: jsonHeaders(token), tags: { kind: 'write', name: 'PUT /card/move/{id}' } },
    )
    check(move, { 'move 200': (r) => r.status === 200 })
  }

  http.get(`${BASE_URL}/workspace/mine`, { headers: jsonHeaders(token), tags: { kind: 'board' } })
  sleep(THINK_TIME_SECONDS)
}
