import React, { useEffect, useState } from 'react'
import BoardPage from './pages/BoardPage'
import LandingPage from './pages/LandingPage'
import DashboardPage from './pages/DashboardPage'
import LoginModal from './components/LoginModal'
import Avatar from './components/Avatar'
import { getStoredUser, signOut as clearSession, consumeOauthCallback } from './api/authApi'
import { rememberVisit } from './api/dashboardApi'

const css = {
  app: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: 'var(--bg-base)',
    overflow: 'hidden',
  },
  topbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 22px',
    height: 52,
    background: 'var(--bg-base)',
    borderBottom: '1px solid var(--border)',
    flexShrink: 0,
    zIndex: 20,
    gap: 14,
  },
  left: { display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 },
  backBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    padding: '6px 12px 6px 9px',
    borderRadius: 'var(--radius-sm)',
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    color: 'var(--text-secondary)',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'color var(--transition-fast), border-color var(--transition-fast)',
  },
  crumb: { display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 },
  crumbMuted: { fontSize: 13, color: 'var(--text-muted)', whiteSpace: 'nowrap' },
  crumbSep: { color: 'var(--text-muted)', fontSize: 13 },
  crumbActive: {
    fontSize: 13.5,
    fontWeight: 600,
    color: 'var(--text-primary)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  right: { display: 'flex', alignItems: 'center', gap: 10 },
  boardLabel: { fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 },
  boardInput: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 7,
    color: 'var(--text-primary)',
    fontSize: 13,
    fontWeight: 500,
    padding: '5px 10px',
    width: 66,
    outline: 'none',
    textAlign: 'center',
  },
  loadBtn: {
    padding: '6px 13px',
    borderRadius: 7,
    background: 'var(--accent)',
    color: '#fff',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    border: 'none',
    transition: 'background var(--transition-fast)',
  },
  main: {
    flex: 1,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
}

export default function App() {
  // null → dashboard (when signed in) or landing page
  const [activeBoardId, setActiveBoardId] = useState(null)
  const [activeBoardName, setActiveBoardName] = useState(null)
  const [activeWorkspace, setActiveWorkspace] = useState(null)
  const [inputId, setInputId] = useState('1')
  const [loginOpen, setLoginOpen] = useState(false)
  const [user, setUser] = useState(null)

  useEffect(() => {
    const oauthUser = consumeOauthCallback()
    setUser(oauthUser || getStoredUser())
  }, [])

  /**
   * Opens a board and records the visit so the dashboard's
   * "Last board" tile has something to point at.
   */
  const openBoard = (id, workspace, boardName) => {
    const parsed = parseInt(id, 10)
    if (isNaN(parsed) || parsed <= 0) return
    const board = workspace?.boards?.find(b => b.boardId === parsed)
    const name = boardName || board?.name || `Board ${parsed}`
    setActiveBoardId(parsed)
    setActiveBoardName(name)
    setActiveWorkspace(workspace || null)
    setInputId(String(parsed))
    rememberVisit({ boardId: parsed, name, workspaceName: workspace?.name })
  }

  const backToDashboard = () => {
    setActiveBoardId(null)
    setActiveBoardName(null)
    setActiveWorkspace(null)
  }

  const handleLogin = (signedInUser) => {
    setUser(signedInUser)
    setLoginOpen(false)
  }

  const signOut = () => {
    clearSession()
    setUser(null)
    backToDashboard()
  }

  // ── Board view ──
  if (user && activeBoardId) {
    return (
      <div style={css.app}>
        <header style={css.topbar}>
          <div style={css.left}>
            <button
              style={css.backBtn}
              onClick={backToDashboard}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
              Dashboard
            </button>
            <div style={css.crumb}>
              {activeWorkspace && (
                <>
                  <span style={css.crumbMuted}>{activeWorkspace.name}</span>
                  <span style={css.crumbSep}>/</span>
                </>
              )}
              <span style={css.crumbActive}>{activeBoardName}</span>
            </div>
          </div>

          <div style={css.right}>
            <span style={css.boardLabel}>Board ID</span>
            <input
              style={css.boardInput}
              type="number"
              value={inputId}
              min="1"
              onChange={e => setInputId(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') openBoard(inputId) }}
              onFocus={e => { e.target.style.borderColor = 'var(--border-focus)' }}
              onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
              aria-label="Board ID"
            />
            <button
              style={css.loadBtn}
              onClick={() => openBoard(inputId)}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-hover)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent)' }}
            >
              Load
            </button>
            <Avatar name={user?.name || 'Guest'} size={28} />
          </div>
        </header>

        <main style={css.main}>
          <BoardPage boardId={activeBoardId} />
        </main>
      </div>
    )
  }

  // ── Dashboard ──
  if (user) {
    return (
      <div style={css.app}>
        <main style={css.main}>
          <DashboardPage
            user={user}
            onOpenBoard={(id, workspace) => openBoard(id, workspace)}
            onSignOut={signOut}
          />
        </main>
      </div>
    )
  }

  // ── Signed out ──
  return (
    <div style={css.app}>
      <main style={{ ...css.main, overflow: 'auto' }}>
        <LandingPage onOpenBoard={() => setLoginOpen(true)} onLogin={() => setLoginOpen(true)} />
      </main>
      {loginOpen && <LoginModal onClose={() => setLoginOpen(false)} onLogin={handleLogin} />}
    </div>
  )
}
