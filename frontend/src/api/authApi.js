import { API_BASE_URL } from './config'

// ── Base URL ─────────────────────────────────────────────────
const BASE_URL = API_BASE_URL

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
  try {
    localStorage.setItem('jwt_token', token)
    localStorage.setItem('kanban_user', JSON.stringify(user))
  } catch {
    // Storage blocked (private mode, quota): the session lasts this page only.
  }
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
  try {
    localStorage.removeItem('jwt_token')
    localStorage.removeItem('kanban_user')
  } catch {
    // Nothing stored to clear.
  }
}

// ── OAuth2 callback ─────────────────────────────────────────
// OauthService redirects to /oauth2/callback#token=<jwt>. The fragment is
// never sent to a server or leaked in a Referer header. ?token= is still read
// as a fallback for an older backend. Either way the token is wiped from the
// address bar (and so from history) right after it is read.
function readCallbackToken(url) {
  const fromHash = new URLSearchParams(url.hash.replace(/^#/, '')).get('token')
  return fromHash || url.searchParams.get('token')
}

export function consumeOauthCallback() {
  const url = new URL(window.location.href)
  if (url.pathname !== '/oauth2/callback') return null
  const token = readCallbackToken(url)
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
