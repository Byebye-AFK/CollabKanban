import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import AppShell from '../components/shell/AppShell'
import PageHeader from '../components/shell/PageHeader'
import SearchField from '../components/shell/SearchField'
import { BoardIcon, Chevron, CheckIcon, CopyIcon, InviteIcon, WarnIcon } from '../components/shell/icons'
import Modal from '../components/ui/Modal'
import StatCards from '../components/dashboard/StatCards'
import GraphView from '../components/dashboard/GraphView'
import WorkspaceList from '../components/dashboard/WorkspaceList'
import useScrollSpy from '../hooks/useScrollSpy'
import { getDashboard, relativeTime } from '../api/dashboardApi'
import { boardProgress } from '../api/boardsApi'
import './DashboardPage.css'

/**
 * DashboardPage — the signed-in home.
 *
 * A greeting, four numbers, the org graph and the workspace table, in
 * one calm column. The sidebar's Graph view and Workspaces entries are
 * sections of this page: clicking one scrolls here, and the sidebar
 * highlight follows whichever section is on screen.
 */
const SECTION_LABEL = {
  dashboard: 'Overview',
  graph: 'Graph',
  workspaces: 'Workspaces',
}

/** Sidebar destinations that are their own page rather than a section here. */
const OTHER_PAGES = ['boards', 'starred', 'teams']

/** Breathing room left above a section once it is scrolled to. */
const SECTION_SCROLL_GAP = 12

/** How long the copy button stays in its confirmed state. */
const COPIED_RESET_MS = 1600

/** How long a toast lingers before dismissing itself. */
const TOAST_MS = 2200

function greeting(date = new Date()) {
  const h = date.getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

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

  // The sidebar highlight follows the scroll position rather than the
  // last click, so it always names the section actually on screen.
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
   * shunting the sidebar off-screen. Measuring against the scroll
   * container keeps the rest of the shell in place.
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
   * A section the sidebar asked for from another page.
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
    // No highlight is set here — scrolling drives it, so the sidebar and
    // the content can never disagree about where you are.
    if (id === 'graph') return scrollToSection(graphRef.current)
    if (id === 'workspaces') return scrollToSection(listRef.current)
    if (id === 'dashboard') return scrollToSection(null)
    if (OTHER_PAGES.includes(id)) return onNavigate?.(id)
    setToast(`${id[0].toUpperCase() + id.slice(1)} is coming next`)
  }

  const openWorkspace = useCallback((ws) => setOpenWs(ws), [])
  const closeWorkspace = useCallback(() => setOpenWs(null), [])

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
    return { ...s, lastVisitedLabel: relativeTime(s.lastVisitedBoard?.at) }
  }, [data])

  const firstName = (user?.name || 'there').split(' ')[0]

  const body = (() => {
    if (loading) {
      return <div className="ui-state"><div className="ui-spinner" /><span>Loading your workspaces…</span></div>
    }
    if (!data) {
      return (
        <div className="ui-state">
          <span className="ui-state-icon is-warn"><WarnIcon size={18} /></span>
          <span className="ui-state-title">Couldn't load your dashboard.</span>
        </div>
      )
    }
    return (
      <div className="app-scroll" ref={scrollRef}>
        <div className="app-content">
          <header className="ui-in">
            <h1 className="app-title">{greeting()}, {firstName}</h1>
            <p className="app-subtitle">Here's where your workspaces stand.</p>
          </header>

          {!data.live && (
            <div className="ui-banner">
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
            <GraphView workspaces={filtered} userName={user?.name} onSelectWorkspace={openWorkspace} />
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
    )
  })()

  return (
    <AppShell
      active={nav}
      collapsed={collapsed}
      user={user}
      workspaces={workspaces}
      onNavigate={navigate}
      onOpenBoard={onOpenBoard}
      onSignOut={onSignOut}
    >
      <PageHeader
        crumbs={['Dashboard', SECTION_LABEL[nav] || 'Overview']}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(c => !c)}
      >
        <SearchField
          value={query}
          onChange={setQuery}
          placeholder="Search workspaces, teams, boards…"
          label="Search"
          hotkey
        />
        <button className="ui-iconbtn" onClick={copyInvite} aria-label="Copy invite link" title={inviteLink}>
          {copied ? <CheckIcon size={15} /> : <CopyIcon size={15} />}
        </button>
        <button
          className="ui-btn is-primary"
          onClick={async () => {
            // Only claim success once the clipboard actually took it.
            if (await copyInvite()) setToast('Invite link copied to your clipboard')
          }}
        >
          <InviteIcon size={14} />
          Invite
        </button>
      </PageHeader>

      {body}

      {openWs && (
        <Modal
          title={openWs.name}
          kicker={`${openWs.teams.length} teams · ${openWs.members.length} members · you are ${openWs.role.toLowerCase()}`}
          onClose={closeWorkspace}
        >
          <div className="dsh-boardlist">
            {openWs.boards.length === 0 && <div className="ui-empty">No boards in this workspace yet.</div>}
            {openWs.boards.map(b => {
              const progress = boardProgress(b)
              return (
                <button
                  key={b.boardId}
                  className="dsh-boardrow"
                  onClick={() => { closeWorkspace(); onOpenBoard?.(b.boardId, openWs) }}
                >
                  <BoardIcon size={15} />
                  <span className="dsh-boardname">{b.name}</span>
                  <span className="dsh-boardmeta">
                    {progress.known ? `${progress.done}/${progress.total} done` : ''}
                  </span>
                  <Chevron size={12} />
                </button>
              )
            })}
          </div>
        </Modal>
      )}

      {toast && <div className="ui-toast" role="status">{toast}</div>}
    </AppShell>
  )
}
