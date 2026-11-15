import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import { consumeOauthCallback, getStoredUser, signOut } from '../authApi'

// A JWT-shaped string whose payload is { "sub": "ada@example.com" }.
function fakeToken(sub = 'ada@example.com') {
  const payload = btoa(JSON.stringify({ sub })).replace(/=+$/, '')
  return `eyJhbGciOiJIUzI1NiJ9.${payload}.signature`
}

function visit(path) {
  window.history.replaceState({}, '', path)
}

beforeEach(() => {
  localStorage.clear()
  visit('/')
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('consumeOauthCallback', () => {
  test('reads the token from the URL fragment and stores the session', () => {
    const token = fakeToken()
    visit(`/oauth2/callback#token=${token}`)

    const user = consumeOauthCallback()

    expect(user).toEqual({ email: 'ada@example.com', name: 'ada' })
    expect(localStorage.getItem('jwt_token')).toBe(token)
    expect(JSON.parse(localStorage.getItem('kanban_user'))).toEqual(user)
  })

  test('falls back to ?token= from an older backend', () => {
    const token = fakeToken('bob@example.com')
    visit(`/oauth2/callback?token=${token}`)

    const user = consumeOauthCallback()

    expect(user).toEqual({ email: 'bob@example.com', name: 'bob' })
    expect(localStorage.getItem('jwt_token')).toBe(token)
  })

  test('prefers the fragment when both carry a token', () => {
    const fragmentToken = fakeToken('frag@example.com')
    visit(`/oauth2/callback?token=${fakeToken('query@example.com')}#token=${fragmentToken}`)

    expect(consumeOauthCallback().email).toBe('frag@example.com')
    expect(localStorage.getItem('jwt_token')).toBe(fragmentToken)
  })

  test('removes the token from the address bar after reading it', () => {
    visit(`/oauth2/callback#token=${fakeToken()}`)

    consumeOauthCallback()

    expect(window.location.pathname).toBe('/')
    expect(window.location.hash).toBe('')
    expect(window.location.search).toBe('')
  })

  test('returns null outside the callback path', () => {
    visit(`/somewhere#token=${fakeToken()}`)

    expect(consumeOauthCallback()).toBeNull()
    expect(localStorage.getItem('jwt_token')).toBeNull()
  })

  test('returns null on the callback path without a token', () => {
    visit('/oauth2/callback#other=1')

    expect(consumeOauthCallback()).toBeNull()
    expect(window.location.pathname).toBe('/oauth2/callback')
  })

  test('still returns the user when storage throws', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    visit(`/oauth2/callback#token=${fakeToken()}`)

    expect(consumeOauthCallback()).toEqual({ email: 'ada@example.com', name: 'ada' })
    expect(window.location.pathname).toBe('/')
  })

  test('falls back to a generic name for an undecodable token', () => {
    visit('/oauth2/callback#token=garbage')

    expect(consumeOauthCallback()).toEqual({ email: null, name: 'there' })
  })
})

describe('session storage', () => {
  test('getStoredUser returns null for corrupt data', () => {
    localStorage.setItem('kanban_user', '{not json')

    expect(getStoredUser()).toBeNull()
  })

  test('signOut clears the session and tolerates blocked storage', () => {
    localStorage.setItem('jwt_token', 't')
    localStorage.setItem('kanban_user', '{}')

    signOut()

    expect(localStorage.getItem('jwt_token')).toBeNull()
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(() => signOut()).not.toThrow()
  })
})
