import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Sidebar from '../components/dashboard/Sidebar'
import StatCards from '../components/dashboard/StatCards'
import GraphView from '../components/dashboard/GraphView'
import WorkspaceList from '../components/dashboard/WorkspaceList'
import Avatar from '../components/Avatar'
import { getDashboard, relativeTime } from '../api/dashboardApi'

const css = {
  shell: { display: 'flex', height: '100%', background: 'var(--bg-base)', overflow: 'hidden' },
  main: { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 },

  topbar: {
    display: 'flex', alignItems: 'center', gap: 14, height: 58, flexShrink: 0,
    padding: '0 22px', borderBottom: '1px solid var(--border)', background: 'var(--bg-base)',
  },
  search: {
    display: 'flex', alignItems: 'center', gap: 9, flex: 1, maxWidth: 420,
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)', padding: '0 12px', height: 36,
  },
  searchInput: {
    flex: 1, background: 'transparent', border: 'none', outline: 'none',
    color: 'var(--text-primary)', fontSize: 13.5,
  },
  spacer: { flex: 1 },
  invite: {
    display: 'flex', alignItems: 'center', height: 36,
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)', padding: '0 4px 0 12px', gap: 8, maxWidth: 320,
  },
  inviteText: {
    fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'ui-monospace, SFMono-Regular, monospace',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 210,
  },
  copyBtn: (done) => ({
    width: 28, height: 28, borderRadius: 6, background: 'transparent',
    color: done ? 'var(--success)' : 'var(--text-muted)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
  }),
  shareBtn: {
    height: 36, padding: '0 16px', borderRadius: 'var(--radius-sm)',
    background: 'var(--accent)', color: '#fff', fontSize: 13, fontWeight: 600,
    cursor: 'pointer', transition: 'background var(--transition-fast)',
  },
  userChip: {
    display: 'flex', alignItems: 'center', gap: 9, paddingLeft: 6,
    borderLeft: '1px solid var(--border)', height: 30,
  },
  userName: { fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.15 },
  userMail: { fontSize: 11, color: 'var(--text-muted)' },

  scroll: { flex: 1, overflowY: 'auto', padding: '20px 22px 30px' },
  topGrid: {
    display: 'grid', gridTemplateColumns: 'minmax(280px, 0.9fr) minmax(0, 2fr)',
    gap: 24, alignItems: 'stretch', height: 440, marginBottom: 22,
    gridAutoRows: 'minmax(0, 1fr)',
  },
  banner: {
    display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16,
    background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)',
    color: 'var(--warning)', borderRadius: 'var(--radius-md)',
    padding: '9px 13px', fontSize: 12.5, fontWeight: 500,
  },
  center: {
    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', gap: 12, color: 'var(--text-muted)',
  },
  spinner: {
    width: 26, height: 26, border: '2.5px solid rgba(255,255,255,0.08)',
    borderTop: '2.5px solid var(--accent)', borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  toast: {
    position: 'fixed', bottom: 22, left: '50%', transform: 'translateX(-50%)',
    background: 'var(--bg-modal)', border: '1px solid var(--border-input)',
    color: 'var(--text-primary)', fontSize: 13, fontWeight: 500,
    padding: '10px 16px', borderRadius: 99, boxShadow: 'var(--shadow-modal)',
    zIndex: 900, animation: 'fadeIn 140ms ease',
  },

  // ── Workspace boards drawer ──
  overlay: {
    position: 'fixed', inset: 0, background: 'var(--bg-overlay)', backdropFilter: 'blur(3px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20,
  },
  drawer: {
    background: 'var(--bg-modal)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-xl)', padding: 24, width: '100%', maxWidth: 440,
    boxShadow: 'var(--shadow-modal)', animation: 'slideUp 180ms ease',
  },
  drawerHead: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 },
  drawerTitle: { fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' },
  drawerSub: { fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 18 },
  closeBtn: {
    width: 28, height: 28, borderRadius: 7, background: 'transparent',
    color: 'var(--text-muted)', fontSize: 17, display: 'flex',
    alignItems: 'center', justifyContent: 'center', cursor: 'pointer', lineHeight: 1,
  },
  boardRow: {
    display: 'flex', alignItems: 'center', gap: 12, width: '100%',
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)', padding: '11px 13px', marginBottom: 8,
    cursor: 'pointer', textAlign: 'left',
    transition: 'border-color var(--transition-fast), background var(--transition-fast)',
  },
  boardMark: {
    width: 30, height: 30, borderRadius: 8, background: 'var(--accent-light)',
    color: 'var(--accent)', display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontSize: 14, flexShrink: 0,
  },
  boardName: { fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)' },
  boardMeta: { fontSize: 11.5, color: 'var(--text-muted)', marginTop: 1 },
}

const SearchIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
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

export default function DashboardPage({ user, onOpenBoard, onSignOut }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [nav, setNav] = useState('dashboard')
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

  if (!loading && !data) {
    return (
      <div style={css.shell}>
        <Sidebar active="dashboard" onNavigate={() => {}} onSignOut={onSignOut} />
        <div style={{ ...css.main, ...css.center }}>
          <span style={{ fontSize: 26, opacity: 0.5 }}>⚠️</span>
          <span style={{ fontSize: 14 }}>Couldn't load your dashboard.</span>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div style={css.shell}>
        <Sidebar active="dashboard" onNavigate={() => {}} onSignOut={onSignOut} />
        <div style={{ ...css.main, ...css.center }}>
          <div style={css.spinner} />
          <span style={{ fontSize: 14 }}>Loading your workspaces…</span>
        </div>
      </div>
    )
  }

  return (
    <div style={css.shell}>
      <style>{`
        @media (max-width: 1080px) {
          .dash-top-grid { grid-template-columns: 1fr !important; height: auto !important; }
          .dash-graph { min-height: 380px; }
        }
        @media (max-width: 720px) {
          .dash-invite { display: none !important; }
          .dash-user-text { display: none !important; }
        }
      `}</style>

      <Sidebar active={nav} onNavigate={navigate} onSignOut={onSignOut} />

      <div style={css.main}>
        {/* ── Top bar ── */}
        <header style={css.topbar}>
          <div style={css.search}>
            <span style={{ color: 'var(--text-muted)', display: 'flex' }}><SearchIcon /></span>
            <input
              style={css.searchInput}
              placeholder="Search workspaces, teams, boards…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              aria-label="Search"
            />
          </div>
          <div style={css.spacer} />

          <div className="dash-invite" style={css.invite}>
            <span style={css.inviteText} title={inviteLink}>{inviteLink}</span>
            <button style={css.copyBtn(copied)} onClick={copyInvite}
              aria-label="Copy invite link" title="Copy invite link">
              <CopyIcon done={copied} />
            </button>
          </div>

          <button
            style={css.shareBtn}
            onClick={() => { copyInvite(); setToast('Invite link copied to your clipboard') }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-hover)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent)' }}
          >
            Invite
          </button>

          <div style={css.userChip}>
            <Avatar name={user?.name || 'Guest'} size={30} />
            <div className="dash-user-text">
              <div style={css.userName}>{user?.name || 'Guest'}</div>
              <div style={css.userMail}>{user?.email || 'not signed in'}</div>
            </div>
          </div>
        </header>

        {/* ── Content ── */}
        <div style={css.scroll} ref={scrollRef}>
          {data && !data.live && (
            <div style={css.banner}>
              <span>◇</span>
              Showing sample data — the backend has no <code>GET /workspace/mine</code> endpoint yet.
            </div>
          )}

          <div className="dash-top-grid" style={css.topGrid}>
            <StatCards
              stats={stats}
              workspaces={workspaces}
              onOpenWorkspace={openWorkspace}
              onOpenBoard={onOpenBoard}
            />
            <div className="dash-graph" ref={graphRef} style={{ minWidth: 0, minHeight: 0 }}>
              <GraphView
                workspaces={filtered}
                userName={user?.name}
                onSelectWorkspace={openWorkspace}
              />
            </div>
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
        <div style={css.overlay} onClick={() => setOpenWs(null)}>
          <div style={css.drawer} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
            <div style={css.drawerHead}>
              <div>
                <div style={css.drawerTitle}>{openWs.name}</div>
              </div>
              <button style={css.closeBtn} onClick={() => setOpenWs(null)} aria-label="Close">×</button>
            </div>
            <div style={css.drawerSub}>
              {openWs.teams.length} teams · {openWs.members.length} members · you are {openWs.role.toLowerCase()}
            </div>
            {openWs.boards.map(b => (
              <button
                key={b.boardId}
                style={css.boardRow}
                onClick={() => { setOpenWs(null); onOpenBoard?.(b.boardId, openWs) }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-focus)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
              >
                <span style={css.boardMark}>⊞</span>
                <span style={{ flex: 1 }}>
                  <span style={{ ...css.boardName, display: 'block' }}>{b.name}</span>
                  <span style={css.boardMeta}>{b.done}/{b.cards} cards done</span>
                </span>
                <span style={{ color: 'var(--text-muted)' }}>›</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {toast && <div style={css.toast}>{toast}</div>}
    </div>
  )
}
