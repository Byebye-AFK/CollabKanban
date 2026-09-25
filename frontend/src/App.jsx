import React, { useEffect, useState } from 'react'
import BoardPage from './pages/BoardPage'
import LandingPage from './pages/LandingPage'
import DashboardPage from './pages/DashboardPage'
import BoardsPage from './pages/BoardsPage'
import StarredPage from './pages/StarredPage'
import TeamsPage from './pages/TeamsPage'
import LoginModal from './components/LoginModal'
import { getStoredUser, signOut as clearSession, consumeOauthCallback } from './api/authApi'
import { rememberVisit } from './api/dashboardApi'

/** Where a board's Back control returns you, named for where you came from. */
const BACK_LABEL = {
  boards: 'Back to boards',
  starred: 'Back to starred',
  teams: 'Back to teams',
  dashboard: 'Back to dashboard',
}

/** Signed-in pages the rail can switch between while no board is open. */
const PAGES = ['dashboard', 'boards', 'starred', 'teams']

/**
 * Rail entries that are sections of the dashboard rather than pages of
 * their own. Clicked from another page they have to open the dashboard
 * first, which then scrolls to them.
 */
const DASHBOARD_SECTIONS = ['graph', 'workspaces']

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
  // Which signed-in page is showing while no board is open.
  const [view, setView] = useState('dashboard')
  // null → dashboard (when signed in) or landing page
  const [activeBoardId, setActiveBoardId] = useState(null)
  const [activeBoardName, setActiveBoardName] = useState(null)
  const [activeWorkspace, setActiveWorkspace] = useState(null)
  const [loginOpen, setLoginOpen] = useState(false)
  const [user, setUser] = useState(null)
  // Set when the rail asked for a dashboard section from another page;
  // the dashboard scrolls there once, then clears it.
  const [pendingSection, setPendingSection] = useState(null)

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

  /**
   * Rail navigation between the signed-in pages.
   *
   * A dashboard section asked for from elsewhere opens the dashboard and
   * is handed on for it to scroll to. Anything the rail offers that has
   * no page yet is left to the page itself, which says so rather than
   * silently doing nothing.
   */
  const navigate = (id) => {
    if (PAGES.includes(id)) {
      setPendingSection(null)
      setView(id)
      return
    }
    if (DASHBOARD_SECTIONS.includes(id)) {
      setPendingSection(id)
      setView('dashboard')
    }
  }

  const handleLogin = (signedInUser) => {
    setUser(signedInUser)
    setLoginOpen(false)
  }

  const signOut = () => {
    clearSession()
    setUser(null)
    setView('dashboard')
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
            backLabel={BACK_LABEL[view] ?? 'Back to dashboard'}
            onSignOut={signOut}
          />
        </main>
      </div>
    )
  }

  // ── Boards library ──
  if (user && view === 'boards') {
    return (
      <div style={css.app}>
        <main style={css.main}>
          <BoardsPage
            user={user}
            onOpenBoard={(id, workspace, boardName) => openBoard(id, workspace, boardName)}
            onNavigate={navigate}
            onSignOut={signOut}
          />
        </main>
      </div>
    )
  }

  // ── Starred boards ──
  if (user && view === 'starred') {
    return (
      <div style={css.app}>
        <main style={css.main}>
          <StarredPage
            user={user}
            onOpenBoard={(id, workspace, boardName) => openBoard(id, workspace, boardName)}
            onNavigate={navigate}
            onSignOut={signOut}
          />
        </main>
      </div>
    )
  }

  // ── Teams library ──
  if (user && view === 'teams') {
    return (
      <div style={css.app}>
        <main style={css.main}>
          <TeamsPage user={user} onNavigate={navigate} onSignOut={signOut} />
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
            onNavigate={navigate}
            onSignOut={signOut}
            initialSection={pendingSection}
            onSectionShown={() => setPendingSection(null)}
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
