import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import GlassShell from '../components/shell/GlassShell'
import GlassTopbar from '../components/shell/GlassTopbar'
import { Chevron, CloseIcon } from '../components/shell/icons'
import StatCards from '../components/dashboard/StatCards'
import GraphView from '../components/dashboard/GraphView'
import WorkspaceList from '../components/dashboard/WorkspaceList'
import useScrollSpy from '../hooks/useScrollSpy'
import { getDashboard, relativeTime } from '../api/dashboardApi'
import './DashboardPage.css'

/**
 * DashboardPage — the signed-in home.
 *
 * Frosted panels floating over a drifting aurora ground, sharing the
 * landing page's typography and blue. The shell it sits in comes from
 * GlassShell; only the stat tiles, graph and workspace table belong to
 * this page.
 */
const SECTION_LABEL = {
  dashboard: 'Overview',
  graph: 'Graph view',
  workspaces: 'Workspaces',
}

/** Rail destinations that are their own page rather than a section here. */
const OTHER_PAGES = ['boards', 'starred', 'teams']

/** Breathing room left above a section once it is scrolled to. */
const SECTION_SCROLL_GAP = 12

/** How long the copy button stays in its confirmed state. */
const COPIED_RESET_MS = 1600

/** How long a toast lingers before dismissing itself. */
const TOAST_MS = 2200

const CopyIcon = ({ done }) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {done
      ? <path d="m5 13 4 4L19 7" />
      : <><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></>}
  </svg>
)

const InviteIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M16 20v-1.5a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4V20" />
    <path d="M9 10.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" />
    <path d="M19 8v6" /><path d="M22 11h-6" />
  </svg>
)

export default function DashboardPage({
  user,
  onOpenBoard,
  onNavigate,
  onSignOut,
  initialSection = null,
  onSectionShown,
}) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [collapsed, setCollapsed] = useState(false)
  const [copied, setCopied] = useState(false)
  const [toast, setToast] = useState(null)
  const [openWs, setOpenWs] = useState(null)

  const statsRef = useRef(null)
  const graphRef = useRef(null)
  const listRef = useRef(null)
  const scrollRef = useRef(null)

  // The rail highlight follows the scroll position rather than the last
  // click, so it always names the section actually on screen.
  const sections = useMemo(() => [
    { id: 'dashboard', ref: statsRef },
    { id: 'graph', ref: graphRef },
    { id: 'workspaces', ref: listRef },
  ], [])
  const nav = useScrollSpy(scrollRef, sections, !loading && !!data)

  useEffect(() => {
    let alive = true
    getDashboard()
      .then(d => { if (alive) { setData(d); setLoading(false) } })
      .catch(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), TOAST_MS)
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
      setTimeout(() => setCopied(false), COPIED_RESET_MS)
      return true
    } catch {
      setToast('Could not copy — select the link manually')
      return false
    }
  }

  /**
   * Scrolls a section into view inside the content column only.
   *
   * `scrollIntoView` would walk up and scroll every scrollable ancestor,
   * including the `.dash` shell — which shunts the sidebar off-screen and
   * reads as the layout glitching. Measuring against the scroll container
   * keeps the rail locked in place.
   */
  const scrollToSection = (target) => {
    const container = scrollRef.current
    if (!container) return
    if (!target) {
      container.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    const offset =
      target.getBoundingClientRect().top - container.getBoundingClientRect().top
    const top = Math.max(container.scrollTop + offset - SECTION_SCROLL_GAP, 0)
    container.scrollTo({ top, behavior: 'smooth' })
  }

  /**
   * A section the rail asked for from another page.
   *
   * It can only be scrolled to once the loaded markup is mounted, so this
   * waits for the data, then tells App it has been honoured — otherwise
   * every later visit to the dashboard would jump to the same section.
   */
  useEffect(() => {
    if (!initialSection || loading || !data) return
    const targets = { graph: graphRef, workspaces: listRef }
    scrollToSection(targets[initialSection]?.current ?? null)
    onSectionShown?.()
  }, [initialSection, loading, data])

  const navigate = (id) => {
    // No setNav here — scrolling drives the highlight, so the rail and the
    // content can never disagree about where you are.
    if (id === 'graph') return scrollToSection(graphRef.current)
    if (id === 'workspaces') return scrollToSection(listRef.current)
    if (id === 'dashboard') return scrollToSection(null)
    if (OTHER_PAGES.includes(id)) return onNavigate?.(id)
    setToast(`${id[0].toUpperCase() + id.slice(1)} is coming next`)
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
      <GlassShell {...rail} onNavigate={() => {}}>
        <div className="dsh-main">
          <div className="dsh-center">
            {loading
              ? <><div className="dsh-spinner" /><span>Loading your workspaces…</span></>
              : <><span style={{ fontSize: 26 }}>⚠️</span><span>Couldn't load your dashboard.</span></>}
          </div>
        </div>
      </GlassShell>
    )
  }

  return (
    <GlassShell {...rail}>
      <div className="dsh-main">
        <GlassTopbar
          scrollRef={scrollRef}
          ready={!loading && !!data}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(c => !c)}
          query={query}
          onQueryChange={setQuery}
          searchPlaceholder="Search workspaces, teams, boards…"
          user={user}
        >
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
            onClick={async () => {
              // Only claim success once the clipboard actually took it.
              if (await copyInvite()) setToast('Invite link copied to your clipboard')
            }}
          >
            <span className="dsh-cta-text">Invite</span>
            <InviteIcon />
          </button>
        </GlassTopbar>

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
              Showing sample data — couldn't reach <code>GET /workspace/mine</code>.
            </div>
          )}

          <div ref={statsRef}>
            <StatCards
              stats={stats}
              workspaces={workspaces}
              onOpenWorkspace={openWorkspace}
              onOpenBoard={onOpenBoard}
            />
          </div>

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
                <CloseIcon />
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
    </GlassShell>
  )
}
