import { Client } from '@stomp/stompjs'

// ── STOMP over native WebSocket ─────────────────────────────────
// Receive-only. Writes go over REST so they stay behind JwtFilter and
// return a status code we can act on; this socket exists purely to hear
// about other people's changes.
//
// Matches the backend's registry.addEndpoint("/ws") (no SockJS) and
// enableSimpleBroker("/topic").
const WS_URL = 'ws://localhost:8080/ws'
const RECONNECT_DELAY_MS = 5000
const HEARTBEAT_MS = 10000

let client = null
// The simple broker has no replay, so the first connect and every later
// reconnect are different events: only the latter leaves a gap to resync.
let hasConnectedBefore = false
let lastNotifiedStatus = false

/** @type {Set<{destination: string, onMessage?: Function, onResync?: Function, stompSub: object|null}>} */
const entries = new Set()
const connectionListeners = new Set()

function notifyConnection(isConnected) {
  if (isConnected === lastNotifiedStatus) return
  lastNotifiedStatus = isConnected

  connectionListeners.forEach(listener => {
    try {
      listener(isConnected)
    } catch (err) {
      console.error('Board socket connection listener failed:', err)
    }
  })
}

function attach(entry) {
  entry.stompSub = client.subscribe(entry.destination, (message) => {
    let payload = null
    try {
      payload = JSON.parse(message.body)
    } catch {
      // A malformed frame is still a signal that something changed —
      // hand the caller null so it can fall back to a refetch.
      payload = null
    }
    entry.onMessage?.(payload)
  })
}

function handleConnect() {
  const isReconnect = hasConnectedBefore
  hasConnectedBefore = true

  // @stomp/stompjs does not restore subscriptions across a reconnect;
  // re-subscribing here is what keeps a board live after a drop.
  entries.forEach(entry => {
    attach(entry)
    // Anything broadcast while we were away is gone for good.
    if (isReconnect) entry.onResync?.()
  })

  notifyConnection(true)
}

function handleDisconnect() {
  entries.forEach(entry => {
    entry.stompSub = null
  })
  notifyConnection(false)
}

function getClient() {
  if (client) return client

  client = new Client({
    brokerURL: WS_URL,
    reconnectDelay: RECONNECT_DELAY_MS,
    heartbeatIncoming: HEARTBEAT_MS,
    heartbeatOutgoing: HEARTBEAT_MS,
  })

  client.onConnect = handleConnect
  client.onWebSocketClose = handleDisconnect
  client.onWebSocketError = () => {
    console.error('Board socket: WebSocket error, will retry')
    handleDisconnect()
  }
  client.onStompError = (frame) => {
    console.error('Board socket STOMP error:', frame?.headers?.message ?? 'unknown')
  }

  return client
}

/**
 * Subscribes to /topic/board/{boardId}.
 *
 * Returns its unsubscribe function synchronously — it never awaits the
 * handshake — so a component that unmounts mid-connect cannot leak a
 * subscription.
 *
 * @param {number|string} boardId
 * @param {{ onMessage?: (payload: object|null) => void,
 *           onResync?: () => void }} handlers
 *   onMessage fires per broadcast; onResync fires after a reconnect, where
 *   missed events mean the caller should refetch the board.
 * @returns {() => void} unsubscribe
 */
export function subscribeToBoard(boardId, handlers = {}) {
  if (boardId === null || boardId === undefined || boardId === '') {
    throw new Error('subscribeToBoard requires a boardId')
  }

  const entry = {
    destination: `/topic/board/${boardId}`,
    onMessage: handlers.onMessage,
    onResync: handlers.onResync,
    stompSub: null,
  }
  entries.add(entry)

  const c = getClient()
  if (c.connected) attach(entry)
  else c.activate() // no-op if a connection attempt is already in flight

  return () => {
    entries.delete(entry)
    try {
      entry.stompSub?.unsubscribe()
    } catch {
      // The socket is already gone, which is exactly what unsubscribe wanted.
    }
    entry.stompSub = null
  }
}

/**
 * Observes connection status, so the UI can say when live updates are off.
 * @param {(isConnected: boolean) => void} listener
 * @returns {() => void} unsubscribe
 */
export function subscribeToConnection(listener) {
  connectionListeners.add(listener)
  return () => connectionListeners.delete(listener)
}

export function isSocketConnected() {
  return client?.connected ?? false
}

export function disconnectSocket() {
  if (!client) return

  client.deactivate()
  client = null
  hasConnectedBefore = false
  entries.forEach(entry => {
    entry.stompSub = null
  })
  notifyConnection(false)
}
