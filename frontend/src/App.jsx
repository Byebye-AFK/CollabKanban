import React, { useEffect, useState } from 'react'
import BoardPage from './pages/BoardPage'
import LandingPage from './pages/LandingPage'
import DashboardPage from './pages/DashboardPage'
import LoginModal from './components/LoginModal'
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
  // BoardPage owns its own chrome (rail, top bar, search), so the app
  // shell hands it the whole viewport rather than stacking a second
  // header above it.
  if (user && activeBoardId) {
    return (
      <div style={css.app}>
        <main style={css.main}>
          <BoardPage
            boardId={activeBoardId}
            boardName={activeBoardName}
            workspace={activeWorkspace}
            user={user}
            onBack={backToDashboard}
            onSignOut={signOut}
          />
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
