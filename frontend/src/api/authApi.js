// ── Base URL ─────────────────────────────────────────────────
const BASE_URL = 'http://localhost:8080'

function decodeJwtEmail(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.sub || payload.email || null
  } catch {
    return null
  }
}

function persistSession(token) {
  const email = decodeJwtEmail(token)
  const user = { email, name: email ? email.split('@')[0] : 'there' }
  localStorage.setItem('jwt_token', token)
  localStorage.setItem('kanban_user', JSON.stringify(user))
  return user
}

// ── Session ──────────────────────────────────────────────────
export function getStoredUser() {
  try {
    const raw = localStorage.getItem('kanban_user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function signOut() {
  localStorage.removeItem('jwt_token')
  localStorage.removeItem('kanban_user')
}

// Captures ?token= from the OAuth2 redirect (see Security.java / OauthService)
export function consumeOauthCallback() {
  const url = new URL(window.location.href)
  if (url.pathname !== '/oauth2/callback') return null
  const token = url.searchParams.get('token')
  if (!token) return null
  const user = persistSession(token)
  window.history.replaceState({}, '', '/')
  return user
}

export function signInWithGoogle() {
  window.location.href = `${BASE_URL}/oauth2/authorization/google`
}

// ── Email / password auth ───────────────────────────────────
export async function login(email, password) {
  const res = await fetch(`${BASE_URL}/user/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) throw new Error('Invalid email or password.')
  const token = await res.text()
  return persistSession(token)
}

export async function signUp(name, email, password) {
  const res = await fetch(`${BASE_URL}/user/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  })
  if (!res.ok) throw new Error('Could not create account.')
  return login(email, password)
}
