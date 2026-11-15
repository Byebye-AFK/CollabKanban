// ── Race-condition test: many users, one board ─────────────────────────────
// Run:  node loadtest/race.mjs          (backend on :8080, Node 22+)
// Env:  USERS=12  ROUNDS=5  BASE_URL=http://localhost:8080  FIRST_USER_ID=<id of the first test user>
//
// loadtest/kanban.js gives every user a private board, so nothing ever
// contends. This script makes users fight over the SAME card / column / team
// at the same instant and checks what the backend guarantees.
//
// Everything created is prefixed "race_" (emails, workspace names).
// Read-only against the backend code: this only talks to its public API.

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:8080'
const USER_COUNT = Number(process.env.USERS ?? 12)
const ROUNDS = Number(process.env.ROUNDS ?? 5)
const FIRST_USER_ID = process.env.FIRST_USER_ID ? Number(process.env.FIRST_USER_ID) : null
const RUN_ID = Date.now()
const PASSWORD = 'RaceTest#123'
const BROADCAST_SETTLE_MS = 600
const SETUP_CONCURRENCY = 4 // bcrypt(12) is CPU-heavy on the server
const ID_GAP_WINDOW = 16 // wider than the ~10 ids a same-email signup burst wastes

// ── HTTP ─────────────────────────────────────────────────────────────────
async function call(method, path, { token, body } = {}) {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(30_000),
    })
    const text = await res.text()
    let json = null
    try { json = JSON.parse(text) } catch { /* plain-text body (the login token) */ }
    return { status: res.status, text, json }
  } catch (err) {
    return { status: 0, text: String(err), json: null }
  }
}

/** Starts every task in the same tick so they hit the server together. */
const fireTogether = (tasks) => Promise.all(tasks.map(task => task()))

const tally = (results) =>
  results.reduce((acc, r) => ({ ...acc, [r.status]: (acc[r.status] ?? 0) + 1 }), {})

const fmt = (counts) =>
  Object.entries(counts).sort().map(([s, n]) => `${n}×${s}`).join('  ') || '—'

const isOk = (r) => r.status >= 200 && r.status < 300
const isServerError = (r) => (r.status >= 500 && r.status !== 501) || r.status === 0

async function mapLimit(items, limit, fn) {
  const out = new Array(items.length)
  let next = 0
  await Promise.all(Array.from({ length: limit }, async () => {
    while (next < items.length) {
      const i = next++
      out[i] = await fn(items[i], i)
    }
  }))
  return out
}

// ── Setup ────────────────────────────────────────────────────────────────
async function createUsers(count) {
  const users = []
  for (let i = 0; i < count; i++) {
    const email = `race_${RUN_ID}_${i}@example.com`
    await call('POST', '/user/add', { body: { name: `race_${i}`, email, password: PASSWORD } })
    users.push({ email, name: `race_${i}`, token: null, id: null })
  }
  return mapLimit(users, SETUP_CONCURRENCY, async (u) => {
    const login = await call('POST', '/user/login', { body: { email: u.email, password: PASSWORD } })
    if (login.status !== 200) throw new Error(`login failed for ${u.email}: ${login.status}`)
    return { ...u, token: login.text }
  })
}

async function createBoard(token, name) {
  const ws = await call('POST', '/workspace/create', { token, body: { name } })
  const workspaceId = ws.json?.workspaceId
  const board = await call('POST', '/board/create', { token, body: { name, workspaceId, position: 1 } })
  const boardId = board.json?.boardId
  await call('POST', '/column/create', { token, body: { name: 'To do', boardId } })
  await call('POST', '/column/create', { token, body: { name: 'Done', boardId } })
  const full = await call('GET', `/board/${boardId}`, { token })
  const column = (n) => full.json?.columns?.find(c => c.name === n)?.columnId
  return { workspaceId, boardId, todoId: column('To do'), doneId: column('Done') }
}

const readBoard = (token, boardId) => call('GET', `/board/${boardId}`, { token })
const allCards = (board) => (board.json?.columns ?? []).flatMap(c => (c.cards ?? []).map(card => ({ ...card, columnId: c.columnId })))

async function newCard(token, columnId, title, assignedTo) {
  const res = await call('POST', '/card/create', { token, body: { title, description: '', columnId, assignedTo } })
  return res.json?.cardId ?? null
}

// ── Finding user ids (the API never returns them) ────────────────────────
// Card create 500s when assignedTo does not exist, so it works as an
// existence check. New users always get the highest ids, so the top N
// existing ids are ours; membership read-back then confirms it by email.
async function discoverUserIds(users, owner, probe) {
  const exists = async (id) => (await call('POST', '/card/create', {
    token: owner.token, body: { title: 'probe', columnId: probe.todoId, assignedTo: id },
  })).status === 200
  // The same-email scenario burns ~10 ids per run, so earlier runs leave
  // gaps that a short look-ahead would mistake for "no more users".
  const existsNear = async (id) => {
    for (let k = 0; k < ID_GAP_WINDOW; k++) if (await exists(id + k)) return true
    return false
  }

  let first = FIRST_USER_ID
  if (first === null) {
    let lo = 1
    let hi = 2
    while (await existsNear(hi)) { lo = hi; hi *= 2; if (hi > 1 << 24) return null }
    while (hi - lo > ID_GAP_WINDOW) {
      const mid = Math.floor((lo + hi) / 2)
      if (await existsNear(mid)) lo = mid; else hi = mid
    }
    let top = lo
    for (let id = lo; id < lo + 2 * ID_GAP_WINDOW; id++) if (await exists(id)) top = id
    first = top - users.length + 1
  }

  const scratch = await call('POST', '/workspace/create', { token: owner.token, body: { name: `race_scratch_${RUN_ID}` } })
  const scratchId = scratch.json?.workspaceId
  const added = []
  for (let id = first; id < first + users.length; id++) {
    added.push(await call('POST', '/member/addmembership', { token: owner.token, body: { workSpaceId: scratchId, userId: id, role: 'MEMBER' } }))
  }
  if (process.env.DEBUG) console.error(`[discover] addmembership statuses: ${fmt(tally(added))}; sample: ${added[0].text.slice(0, 120)}`)
  // /workspace/mine leaves the caller out of `members`, so read it as two
  // different users and merge: each one shows up in the other's view.
  const viewOf = async (u) => {
    const mine = await call('GET', '/workspace/mine', { token: u.token })
    return mine.json?.find(w => w.workSpaceId === scratchId)?.members ?? []
  }
  const members = [...await viewOf(users[0]), ...await viewOf(users[1])]
  const byEmail = new Map(members.map(m => [m.userEmail, m.userId]))
  if (process.env.DEBUG) console.error(`[discover] first=${first} scratch=${scratchId} resolved=${byEmail.size}/${users.length}`)
  if (!users.every(u => byEmail.has(u.email))) return null
  return users.map(u => ({ ...u, id: byEmail.get(u.email) }))
}

// ── Live updates (STOMP over a plain WebSocket) ──────────────────────────
function listenToBoard(boardId) {
  let frames = 0
  const wsUrl = BASE_URL.replace(/^http/, 'ws') + '/ws'
  let socket
  const ready = new Promise((resolve) => {
    try { socket = new WebSocket(wsUrl) } catch { return resolve(false) }
    const failTimer = setTimeout(() => resolve(false), 5000)
    socket.onopen = () => socket.send('CONNECT\naccept-version:1.2\nheart-beat:0,0\n\n\0')
    socket.onerror = () => resolve(false)
    socket.onmessage = (event) => {
      const data = String(event.data)
      if (data.startsWith('CONNECTED')) {
        socket.send(`SUBSCRIBE\nid:race\ndestination:/topic/board/${boardId}\n\n\0`)
        clearTimeout(failTimer)
        resolve(true)
      }
      frames += data.split('\0').filter(f => f.startsWith('MESSAGE')).length
    }
  })
  return { ready, count: () => frames, close: () => socket?.close() }
}

// ── Scenarios ────────────────────────────────────────────────────────────
const report = []
const record = (scenario, verdict, observed, detail = '') => report.push({ scenario, verdict, observed, detail })

async function signupSameEmail() {
  const email = `race_${RUN_ID}_dup@example.com`
  const results = await fireTogether(Array.from({ length: 10 }, (_, i) =>
    () => call('POST', '/user/add', { body: { name: `dup_${i}`, email, password: PASSWORD } })))
  const created = results.filter(isOk).length
  const errors = results.filter(isServerError).length
  const verdict = created !== 1 ? 'FAIL' : errors ? 'WARN' : 'PASS'
  record('10 users sign up with the SAME email', verdict, fmt(tally(results)),
    created > 1 ? 'duplicate accounts were created'
      : errors ? 'only one account created (DB unique constraint), but losers get 5xx instead of 409' : '')
}

async function cardCreateSamePosition(users, board) {
  const results = await fireTogether(users.map((u, i) =>
    () => newCard(u.token, board.todoId, `race-${i}`, undefined)))
  const cards = allCards(await readBoard(users[0].token, board.boardId)).filter(c => c.columnId === board.todoId)
  const positions = cards.map(c => c.position)
  const duplicated = positions.length - new Set(positions).size
  record(`${users.length} users create a card in the SAME column at once`,
    duplicated ? 'FAIL' : 'PASS',
    `${results.filter(Boolean).length} created, ${duplicated} cards share a position`,
    duplicated ? `positions: ${[...positions].sort((a, b) => a - b).join(', ')} — "last position + 1000" is read-then-write with no lock` : '')
}

// Control: the same moves, one at a time. If these fail too, the 5xx in the
// contended run is not a race at all, just a broken endpoint.
async function controlSequentialMoves(users, board) {
  const cardId = await newCard(users[0].token, board.todoId, 'control', undefined)
  const results = []
  for (let i = 0; i < users.length; i++) {
    results.push(await call('PUT', `/card/move/${cardId}`, {
      token: users[i].token,
      body: { boardId: board.boardId, targetColumnId: i % 2 ? board.doneId : board.todoId, position: 1000 * (i + 1) },
    }))
  }
  record(`CONTROL: the same ${users.length} moves, one after another`,
    results.every(isOk) ? 'PASS' : 'FAIL',
    fmt(tally(results)),
    results.every(isOk) ? 'moves work on their own, so failures below are caused by concurrency' : 'moves fail even without concurrency')
}

async function moveSameCard(users, board) {
  const listener = listenToBoard(board.boardId)
  const canListen = await listener.ready
  const totals = { ok: 0, conflict: 0, serverError: 0, other: 0, broadcasts: 0, finalMismatch: 0 }
  const statuses = []

  for (let round = 0; round < ROUNDS; round++) {
    const cardId = await newCard(users[0].token, board.todoId, `contended-${round}`, undefined)
    const before = listener.count()
    const moves = users.map((u, i) => ({
      token: u.token,
      body: { boardId: board.boardId, targetColumnId: i % 2 ? board.doneId : board.todoId, position: 1000 * (i + 1) },
    }))
    const results = await fireTogether(moves.map(m => () => call('PUT', `/card/move/${cardId}`, m)))
    await new Promise(r => setTimeout(r, BROADCAST_SETTLE_MS))

    statuses.push(...results)
    totals.ok += results.filter(isOk).length
    totals.conflict += results.filter(r => r.status === 409).length
    totals.serverError += results.filter(isServerError).length
    totals.other += results.filter(r => !isOk(r) && r.status !== 409 && !isServerError(r)).length
    totals.broadcasts += listener.count() - before

    const final = allCards(await readBoard(users[0].token, board.boardId)).filter(c => c.cardId === cardId)
    const matchesAWrite = final.length === 1 && moves.some(m =>
      m.body.position === final[0].position && m.body.targetColumnId === final[0].columnId)
    if (!matchesAWrite) totals.finalMismatch += 1
  }
  listener.close()

  const label = `${users.length} users MOVE the same card at once (${ROUNDS} rounds)`
  const total = ROUNDS * users.length
  record(label,
    totals.finalMismatch ? 'FAIL' : totals.serverError ? 'WARN' : 'PASS',
    `${fmt(tally(statuses))}`,
    totals.serverError
      ? `${totals.serverError}/${total} requests lost the optimistic-lock race and came back as 5xx — the frontend's 409 resync path never fires`
      : totals.finalMismatch ? 'final card state matches none of the submitted moves' : '')

  if (canListen) {
    const phantom = totals.broadcasts - totals.ok
    record('Live updates vs. moves that really committed',
      phantom > 0 ? 'FAIL' : 'PASS',
      `${totals.broadcasts} broadcasts for ${totals.ok} successful moves`,
      phantom > 0 ? `${phantom} broadcasts describe moves that were rolled back (message is sent inside the transaction, before commit)` : '')
  } else {
    record('Live updates vs. moves that really committed', 'SKIP', 'could not open STOMP socket on /ws')
  }
}

async function deleteVsMove(users, board) {
  const statuses = { delete: [], move: [] }
  for (let round = 0; round < ROUNDS; round++) {
    const cardId = await newCard(users[0].token, board.todoId, `doomed-${round}`, undefined)
    const tasks = [
      async () => ({ kind: 'delete', ...(await call('DELETE', `/card/${cardId}`, { token: users[0].token })) }),
      ...users.slice(1, 7).map((u, i) => async () => ({
        kind: 'move',
        ...(await call('PUT', `/card/move/${cardId}`, {
          token: u.token, body: { boardId: board.boardId, targetColumnId: board.doneId, position: 1000 * (i + 1) },
        })),
      })),
    ]
    const results = await fireTogether(tasks)
    statuses.delete.push(...results.filter(r => r.kind === 'delete'))
    statuses.move.push(...results.filter(r => r.kind === 'move'))
  }
  const serverErrors = statuses.move.filter(isServerError).length
  record(`1 user DELETES a card while 6 others MOVE it (${ROUNDS} rounds)`,
    serverErrors ? 'FAIL' : 'PASS',
    `delete: ${fmt(tally(statuses.delete))} | moves: ${fmt(tally(statuses.move))}`,
    serverErrors ? 'moving a card that is being (or was) deleted returns 5xx, not 404/409' : '')
}

async function deleteSameCard(users, board) {
  const cardId = await newCard(users[0].token, board.todoId, 'delete-me', undefined)
  const results = await fireTogether(users.slice(0, 8).map(u => () => call('DELETE', `/card/${cardId}`, { token: u.token })))
  const errors = results.filter(isServerError).length
  record('8 users DELETE the same card at once',
    errors ? 'FAIL' : 'PASS',
    fmt(tally(results)),
    results.some(r => r.status === 501) ? '501 Not Implemented is used for "already deleted"' : '')
}

async function duplicateTeamMember(users, owner, target) {
  const ws = await call('POST', '/workspace/create', { token: owner.token, body: { name: `race_team_ws_${RUN_ID}` } })
  const workSpaceId = ws.json?.workspaceId
  await call('POST', '/member/addmembership', { token: owner.token, body: { workSpaceId, userId: owner.id, role: 'OWNER' } })
  await call('POST', '/member/addmembership', { token: owner.token, body: { workSpaceId, userId: target.id, role: 'MEMBER' } })
  const team = await call('POST', '/team/add', { token: owner.token, body: { teamName: 'race-team', workSpaceId } })
  const teamId = team.json?.teamId

  const results = await fireTogether(Array.from({ length: 10 }, () =>
    () => call('POST', '/team/addMember', { token: owner.token, body: { userId: target.id, teamId } })))
  const mine = await call('GET', '/workspace/mine', { token: owner.token })
  const stored = mine.json?.find(w => w.workSpaceId === workSpaceId)?.teams?.find(t => t.teamId === teamId)
  const rows = (stored?.members ?? []).filter(m => m.userId === target.id).length

  record('10 concurrent requests add the SAME user to a team',
    rows > 1 ? 'FAIL' : 'PASS',
    `${fmt(tally(results))} → the user appears ${rows}× on the team`,
    rows > 1 ? '"already a member" is a check-then-insert and the table has no unique constraint' : '')

  // A user who is not in the workspace yet, so exactly one request may win.
  const newcomer = users[2]
  const dup = await fireTogether(Array.from({ length: 6 }, () =>
    () => call('POST', '/member/addmembership', { token: owner.token, body: { workSpaceId, userId: newcomer.id, role: 'ADMIN' } })))
  const created = dup.filter(isOk).length
  const errors = dup.filter(isServerError).length
  record('6 concurrent requests add the SAME new member to a workspace',
    created !== 1 ? 'FAIL' : errors ? 'WARN' : 'PASS',
    fmt(tally(dup)),
    created > 1 ? 'the same person was added more than once'
      : errors ? 'unique constraint holds (exactly one winner), but the losers get 500 instead of 409' : '')
}

async function accessControl(outsider, board, victim) {
  const read = await readBoard(outsider.token, board.boardId)
  const cardId = await newCard(victim.token, board.todoId, 'private-work', undefined)
  const move = await call('PUT', `/card/move/${cardId}`, {
    token: outsider.token, body: { boardId: board.boardId, targetColumnId: board.doneId, position: 1 },
  })
  const del = await call('DELETE', `/card/${cardId}`, { token: outsider.token })
  const allowed = [read, move, del].filter(isOk).length
  record('Bonus (not a race): a user who is NOT in the workspace reads / moves / deletes',
    allowed ? 'FAIL' : 'PASS',
    `read ${read.status}, move ${move.status}, delete ${del.status}`,
    allowed ? 'any logged-in user can act on any board — membership is never checked' : '')
}

// ── Main ─────────────────────────────────────────────────────────────────
function printReport() {
  const icon = { PASS: '✅', WARN: '⚠️ ', FAIL: '❌', SKIP: '⏭️ ' }
  console.log('\n══ Race-condition results ══════════════════════════════════════')
  for (const r of report) {
    console.log(`\n${icon[r.verdict]} ${r.verdict}  ${r.scenario}\n     observed: ${r.observed}`)
    if (r.detail) console.log(`     why:      ${r.detail}`)
  }
  const count = (v) => report.filter(r => r.verdict === v).length
  console.log(`\n${count('PASS')} passed · ${count('WARN')} warnings · ${count('FAIL')} failed · ${count('SKIP')} skipped`)
  console.log(`Test data is prefixed "race_" (run ${RUN_ID}).`)
}

async function main() {
  const probeUp = await call('GET', '/error')
  if (probeUp.status === 0) throw new Error(`backend not reachable at ${BASE_URL}`)

  console.log(`Creating ${USER_COUNT} users + 1 outsider (bcrypt makes this take a moment)…`)
  const everyone = await createUsers(USER_COUNT + 1)
  const users = everyone.slice(0, USER_COUNT)
  const outsider = everyone[USER_COUNT]

  const board = await createBoard(users[0].token, `race_board_${RUN_ID}`)
  if (!board.todoId || !board.doneId) throw new Error('could not set up the board')

  // Must run before anything else creates users: failed signups still burn
  // sequence values, which would break the "newest ids are ours" assumption.
  const probeBoard = await createBoard(users[0].token, `race_probe_${RUN_ID}`)
  // Includes the outsider (created last, so it owns the newest id).
  const withIds = (await discoverUserIds(everyone, users[0], probeBoard))?.slice(0, USER_COUNT) ?? null

  console.log('Running scenarios…')
  await signupSameEmail()
  await cardCreateSamePosition(users, board)
  await controlSequentialMoves(users, board)
  await moveSameCard(users, board)
  await deleteVsMove(users, board)
  await deleteSameCard(users, board)
  await accessControl(outsider, board, users[0])

  if (withIds) await duplicateTeamMember(withIds, withIds[0], withIds[1])
  else record('Team / membership duplicate races', 'SKIP', 'could not work out user ids',
    'rerun with FIRST_USER_ID=<id of the first race_ user> (see the users table, newest rows)')

  printReport()
}

main().catch((err) => { console.error(`\nrace test aborted: ${err.message}`); process.exit(1) })
