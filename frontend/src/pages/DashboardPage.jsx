import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Sidebar from '../components/dashboard/Sidebar'
import StatCards from '../components/dashboard/StatCards'
import GraphView from '../components/dashboard/GraphView'
import WorkspaceList from '../components/dashboard/WorkspaceList'
import Avatar from '../components/Avatar'
import { getDashboard, relativeTime } from '../api/dashboardApi'
import './DashboardPage.css'

/**
 * DashboardPage — the signed-in home.
 *
 * Frosted panels floating over a drifting aurora ground, sharing the
 * landing page's typography and blue. All of its styling lives in
 * DashboardPage.css under the .dash scope, so the dark board shell is
 * untouched by it.
 */
const SECTION_LABEL = {
  dashboard: 'Overview',
  graph: 'Graph view',
  workspaces: 'Workspaces',
}

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.9" strokeLinecap="round">
    <circle cx="11" cy="11" r="7" /><path d="m20 20-3.6-3.6" />
  </svg>
)

const CopyIcon = ({ done }) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {done
      ? <path d="m5 13 4 4L19 7" />
      : <><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></>}
  </svg>
)

const Chevron = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 6l6 6-6 6" />
  </svg>
)

const Aurora = () => (
  <div className="dsh-aurora" aria-hidden="true">
    <i className="dsh-orb-a" style={{ '--dx': '6%',  '--dy': '5%',  '--dur': '28s' }} />
    <i className="dsh-orb-b" style={{ '--dx': '-5%', '--dy': '7%',  '--dur': '32s', '--delay': '-6s' }} />
    <i className="dsh-orb-c" style={{ '--dx': '4%',  '--dy': '-6%', '--dur': '26s', '--delay': '-12s' }} />
    <i className="dsh-orb-d" style={{ '--dx': '-7%', '--dy': '-4%', '--dur': '34s', '--delay': '-3s' }} />
  </div>
)

/** Shell used by every state, so the background never flashes between them. */
function Shell({ children, ...rail }) {
  return (
    <div className="dash">
      <Aurora />
      <Sidebar {...rail} />
      {children}
    </div>
  )
}

export default function DashboardPage({ user, onOpenBoard, onSignOut }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [nav, setNav] = useState('dashboard')
  const [collapsed, setCollapsed] = useState(false)
  const [copied, setCopied] = useState(false)
  const [toast, setToast] = useState(null)
  const [openWs, setOpenWs] = useState(null)

  const graphRef = useRef(null)
  const listRef = useRef(null)
  const scrollRef = useRef(null)

  useEffect(() => {
    let alive = true
    getDashboard()
      .then(d => { if (alive) { setData(d); setLoading(false) } })
      .catch(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2200)
    return () => clearTimeout(t)
  }, [toast])

  const inviteLink = useMemo(
    () => `${window.location.origin}/invite/${(user?.email || 'guest').split('@')[0]}-wk21`,
    [user],
  )

  const copyInvite = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      setToast('Could not copy — select the link manually')
    }
  }

  const navigate = (id) => {
    setNav(id)
    const target = id === 'graph' ? graphRef.current : id === 'workspaces' ? listRef.current : null
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    else if (id === 'dashboard') scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
    else setToast(`${id[0].toUpperCase() + id.slice(1)} is coming next`)
  }

  const openWorkspace = useCallback((ws) => setOpenWs(ws), [])

  const workspaces = data?.workspaces ?? []

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return workspaces
    return workspaces.filter(w =>
      w.name.toLowerCase().includes(q) ||
      w.teams.some(t => t.name.toLowerCase().includes(q)) ||
      w.boards.some(b => b.name.toLowerCase().includes(q)),
    )
  }, [workspaces, query])

  const stats = useMemo(() => {
    if (!data) return null
    const s = data.stats
    return {
      ...s,
      lastWorkspace: s.lastWorkspace
        ? { ...s.lastWorkspace, lastActiveLabel: relativeTime(s.lastWorkspace.lastActive) }
        : null,
      lastVisitedLabel: relativeTime(s.lastVisitedBoard?.at),
    }
  }, [data])

  const rail = {
    active: nav,
    collapsed,
    user,
    onNavigate: navigate,
    onSignOut,
  }

  if (loading || !data) {
    return (
      <Shell {...rail} onNavigate={() => {}}>
        <div className="dsh-main">
          <div className="dsh-center">
            {loading
              ? <><div className="dsh-spinner" /><span>Loading your workspaces…</span></>
              : <><span style={{ fontSize: 26 }}>⚠️</span><span>Couldn't load your dashboard.</span></>}
          </div>
        </div>
      </Shell>
    )
  }

  return (
    <Shell {...rail}>
      <div className="dsh-main">
        {/* ── Top bar ── */}
        <header className="dsh-topbar dsh-glass">
          <button
            className="dsh-iconbtn dsh-collapse"
            onClick={() => setCollapsed(c => !c)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!collapsed}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"
              style={{ transform: collapsed ? 'scaleX(-1)' : 'none' }}>
              <path d="M20 12H5" /><path d="m10 7-5 5 5 5" />
            </svg>
          </button>

          <div className="dsh-search">
            <SearchIcon />
            <input
              placeholder="Search workspaces, teams, boards…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              aria-label="Search"
            />
          </div>

          <div className="dsh-spacer" />

          <div className="dsh-invite">
            <span className="dsh-invite-text" title={inviteLink}>{inviteLink}</span>
            <button
              className={`dsh-copybtn${copied ? ' is-done' : ''}`}
              onClick={copyInvite}
              aria-label="Copy invite link"
              title="Copy invite link"
            >
              <CopyIcon done={copied} />
            </button>
          </div>

          <button
            className="dsh-cta"
            onClick={() => { copyInvite(); setToast('Invite link copied to your clipboard') }}
          >
            <span className="dsh-cta-text">Invite</span>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 20v-1.5a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4V20" />
              <path d="M9 10.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" />
              <path d="M19 8v6" /><path d="M22 11h-6" />
            </svg>
          </button>

          <span className="dsh-avatar-ring"><Avatar name={user?.name || 'Guest'} size={32} /></span>
        </header>

        {/* ── Content ── */}
        <div className="dsh-scroll" ref={scrollRef}>
          <div className="dsh-crumbbar dsh-glass dsh-in">
            <div>
              <h1 className="dsh-pagetitle">
                {(user?.name || 'there').split(' ')[0]}'s dashboard
              </h1>
            </div>
            <nav className="dsh-crumbs" aria-label="Breadcrumb">
              <span>Home</span><Chevron />
              <span>Dashboard</span><Chevron />
              <span className="dsh-crumb-now">{SECTION_LABEL[nav] || 'Overview'}</span>
            </nav>
          </div>

          {!data.live && (
            <div className="dsh-banner dsh-in" style={{ '--in': '60ms' }}>
              <span>◇</span>
              Showing sample data — the backend has no <code>GET /workspace/mine</code> endpoint yet.
            </div>
          )}

          <StatCards
            stats={stats}
            workspaces={workspaces}
            onOpenWorkspace={openWorkspace}
            onOpenBoard={onOpenBoard}
          />

          <div ref={graphRef}>
            <GraphView
              workspaces={filtered}
              userName={user?.name}
              onSelectWorkspace={openWorkspace}
            />
          </div>

          <div ref={listRef}>
            <WorkspaceList
              workspaces={filtered}
              relativeTime={relativeTime}
              onOpenWorkspace={openWorkspace}
              onCreateWorkspace={() => setToast('Workspace creation lands with POST /workspace/create')}
            />
          </div>
        </div>
      </div>

      {/* ── Boards drawer ── */}
      {openWs && (
        <div className="dsh-overlay" onClick={() => setOpenWs(null)}>
          <div className="dsh-drawer" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="dsh-drawer-head">
              <div className="dsh-drawer-title">{openWs.name}</div>
              <button className="dsh-iconbtn" onClick={() => setOpenWs(null)} aria-label="Close">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12" /><path d="M18 6 6 18" /></svg>
              </button>
            </div>
            <div className="dsh-drawer-sub">
              {openWs.teams.length} teams · {openWs.members.length} members · you are {openWs.role.toLowerCase()}
            </div>
            {openWs.boards.map(b => (
              <button
                key={b.boardId}
                className="dsh-boardrow"
                onClick={() => { setOpenWs(null); onOpenBoard?.(b.boardId, openWs) }}
              >
                <span className="dsh-boardmark">⊞</span>
                <span style={{ flex: 1 }}>
                  <span className="dsh-boardname">{b.name}</span>
                  <span className="dsh-boardmeta">{b.done}/{b.cards} cards done</span>
                </span>
                <Chevron />
              </button>
            ))}
          </div>
        </div>
      )}

      {toast && <div className="dsh-toast">{toast}</div>}
    </Shell>
  )
}
