import { describe, test, expect, beforeEach, vi } from 'vitest'

// Fake STOMP client. Records what the real @stomp/stompjs client would be
// asked to do, and exposes helpers to simulate connects, drops and frames.
const { clients } = vi.hoisted(() => ({ clients: [] }))

vi.mock('@stomp/stompjs', () => {
  class FakeClient {
    constructor(config) {
      this.config = config
      this.connected = false
      this.activateCount = 0
      this.deactivateCount = 0
      this.subscriptions = []
      clients.push(this)
    }

    activate() {
      this.activateCount += 1
    }

    deactivate() {
      this.deactivateCount += 1
      this.connected = false
    }

    subscribe(destination, handler) {
      const sub = {
        destination,
        handler,
        unsubscribed: false,
        // A dropped socket kills its subscriptions: the broker has no
        // record of them once the session ends.
        dead: false,
        unsubscribe() {
          this.unsubscribed = true
        },
      }
      this.subscriptions.push(sub)
      return sub
    }

    // ── test helpers ──
    simulateConnect() {
      this.connected = true
      this.onConnect?.({})
    }

    simulateDrop() {
      this.connected = false
      this.subscriptions.forEach(s => { s.dead = true })
      this.onWebSocketClose?.({})
    }

    deliver(destination, body) {
      this.subscriptions
        .filter(s => s.destination === destination && !s.unsubscribed && !s.dead)
        .forEach(s => s.handler({ body }))
    }
  }

  return { Client: FakeClient }
})

/** Fresh module singleton per test — socket.js holds module-level state. */
async function loadSocket() {
  vi.resetModules()
  clients.length = 0
  return import('../socket')
}

const only = () => clients[clients.length - 1]

describe('subscribeToBoard', () => {
  test('subscribes to the board topic once the connection opens', async () => {
    // Arrange
    const { subscribeToBoard } = await loadSocket()

    // Act
    subscribeToBoard(7, { onMessage: () => {} })
    only().simulateConnect()

    // Assert
    expect(only().subscriptions.map(s => s.destination)).toEqual(['/topic/board/7'])
  })

  test('returns an unsubscribe function synchronously, before the socket connects', async () => {
    const { subscribeToBoard } = await loadSocket()

    const unsubscribe = subscribeToBoard(7, { onMessage: () => {} })

    expect(typeof unsubscribe).toBe('function')
    expect(only().connected).toBe(false)
  })

  test('does not subscribe when unsubscribed before the connection opens', async () => {
    // Guards the leak where a component unmounts mid-handshake.
    const { subscribeToBoard } = await loadSocket()

    const unsubscribe = subscribeToBoard(7, { onMessage: () => {} })
    unsubscribe()
    only().simulateConnect()

    expect(only().subscriptions).toHaveLength(0)
  })

  test('stops delivering messages after unsubscribe', async () => {
    const { subscribeToBoard } = await loadSocket()
    const onMessage = vi.fn()

    const unsubscribe = subscribeToBoard(7, { onMessage })
    only().simulateConnect()
    unsubscribe()
    only().deliver('/topic/board/7', '{"cardId":1}')

    expect(onMessage).not.toHaveBeenCalled()
  })

  test('passes the parsed message payload to onMessage', async () => {
    const { subscribeToBoard } = await loadSocket()
    const onMessage = vi.fn()

    subscribeToBoard(7, { onMessage })
    only().simulateConnect()
    only().deliver('/topic/board/7', '{"cardId":42,"targetColumnId":3}')

    expect(onMessage).toHaveBeenCalledWith({ cardId: 42, targetColumnId: 3 })
  })

  test('passes null to onMessage when the body is not valid JSON', async () => {
    const { subscribeToBoard } = await loadSocket()
    const onMessage = vi.fn()

    subscribeToBoard(7, { onMessage })
    only().simulateConnect()
    only().deliver('/topic/board/7', 'not json')

    expect(onMessage).toHaveBeenCalledWith(null)
  })

  test('keeps each board on its own topic', async () => {
    const { subscribeToBoard } = await loadSocket()
    const onSeven = vi.fn()
    const onNine = vi.fn()

    subscribeToBoard(7, { onMessage: onSeven })
    subscribeToBoard(9, { onMessage: onNine })
    only().simulateConnect()
    only().deliver('/topic/board/9', '{"cardId":1}')

    expect(onSeven).not.toHaveBeenCalled()
    expect(onNine).toHaveBeenCalledTimes(1)
  })

  test('rejects a missing boardId rather than subscribing to a null topic', async () => {
    const { subscribeToBoard } = await loadSocket()

    expect(() => subscribeToBoard(undefined, { onMessage: () => {} })).toThrow(/boardId/)
  })
})

describe('reconnect handling', () => {
  test('re-subscribes to the board topic after a dropped connection', async () => {
    // @stomp/stompjs does not restore subscriptions itself.
    const { subscribeToBoard } = await loadSocket()

    subscribeToBoard(7, { onMessage: () => {} })
    only().simulateConnect()
    only().simulateDrop()
    only().simulateConnect()

    expect(only().subscriptions).toHaveLength(2)
    const live = only().subscriptions.filter(s => !s.unsubscribed && !s.dead)
    expect(live).toHaveLength(1)
    expect(live[0].destination).toBe('/topic/board/7')
  })

  test('delivers messages again after a reconnect', async () => {
    const { subscribeToBoard } = await loadSocket()
    const onMessage = vi.fn()

    subscribeToBoard(7, { onMessage })
    only().simulateConnect()
    only().simulateDrop()
    only().simulateConnect()
    only().deliver('/topic/board/7', '{"cardId":1}')

    expect(onMessage).toHaveBeenCalledTimes(1)
  })

  test('calls onResync after a reconnect, since the broker has no replay', async () => {
    const { subscribeToBoard } = await loadSocket()
    const onResync = vi.fn()

    subscribeToBoard(7, { onResync })
    only().simulateConnect()
    only().simulateDrop()
    only().simulateConnect()

    expect(onResync).toHaveBeenCalledTimes(1)
  })

  test('does not call onResync on the first connect, when the caller has just loaded', async () => {
    const { subscribeToBoard } = await loadSocket()
    const onResync = vi.fn()

    subscribeToBoard(7, { onResync })
    only().simulateConnect()

    expect(onResync).not.toHaveBeenCalled()
  })
})

describe('connection status', () => {
  test('reports disconnected before the handshake completes', async () => {
    const { subscribeToBoard, isSocketConnected } = await loadSocket()

    subscribeToBoard(7, {})

    expect(isSocketConnected()).toBe(false)
  })

  test('notifies listeners when the connection opens and drops', async () => {
    const { subscribeToBoard, subscribeToConnection } = await loadSocket()
    const listener = vi.fn()

    subscribeToConnection(listener)
    subscribeToBoard(7, {})
    only().simulateConnect()
    only().simulateDrop()

    expect(listener.mock.calls).toEqual([[true], [false]])
  })

  test('does not repeat a status listeners have already been told about', async () => {
    const { subscribeToBoard, subscribeToConnection } = await loadSocket()
    const listener = vi.fn()

    subscribeToConnection(listener)
    subscribeToBoard(7, {})
    only().simulateDrop()

    expect(listener).not.toHaveBeenCalled()
  })

  test('stops notifying a removed connection listener', async () => {
    const { subscribeToBoard, subscribeToConnection } = await loadSocket()
    const listener = vi.fn()

    const unsubscribe = subscribeToConnection(listener)
    unsubscribe()
    subscribeToBoard(7, {})
    only().simulateConnect()

    expect(listener).not.toHaveBeenCalled()
  })
})

describe('receive-only contract', () => {
  test('exposes no publish helper: writes go over REST', async () => {
    const socket = await loadSocket()

    expect(socket.publishMoveCard).toBeUndefined()
  })

  test('connects without SockJS, matching the backend endpoint', async () => {
    const { subscribeToBoard } = await loadSocket()

    subscribeToBoard(7, {})

    expect(only().config.brokerURL).toBe('ws://localhost:8080/ws')
  })
})

describe('disconnectSocket', () => {
  test('deactivates the underlying client', async () => {
    const { subscribeToBoard, disconnectSocket } = await loadSocket()

    subscribeToBoard(7, {})
    only().simulateConnect()
    disconnectSocket()

    expect(only().deactivateCount).toBe(1)
  })

  test('reports disconnected afterwards', async () => {
    const { subscribeToBoard, disconnectSocket, isSocketConnected } = await loadSocket()

    subscribeToBoard(7, {})
    only().simulateConnect()
    disconnectSocket()

    expect(isSocketConnected()).toBe(false)
  })
})
