import React, { useEffect, useMemo, useRef, useState } from 'react'
import GlassShell from '../components/shell/GlassShell'
import GlassTopbar from '../components/shell/GlassTopbar'
import { Chevron } from '../components/shell/icons'
import LibraryToolbar from '../components/library/LibraryToolbar'
import LibraryGrid from '../components/library/LibraryGrid'
import LibraryGridSkeleton from '../components/library/LibraryGridSkeleton'
import TeamCard from '../components/teams/TeamCard'
import { getDashboard } from '../api/dashboardApi'
import { flattenTeams, filterTeams, sortTeams, largestTeam, SORTS } from '../api/teamsApi'
import './TeamsPage.css'

/**
 * TeamsPage — every team the user can reach, on one page.
 *
 * Teams arrive inside GET /workspace/mine, so this reuses
 * getDashboard() rather than asking the server separately, and shares
 * the Boards page's grid, toolbar and card shell.
 *
 * Read-only by design, not by omission: the workspace payload carries a
 * team's name and member count but no team id and no member list, and
 * POST /team/add/{name} does not attach the new team to a workspace.
 * Until those land there is nothing safe to edit from here, so the page
 * says so rather than offering controls that would silently misfire.
 */
export default function TeamsPage({ user, onNavigate, onSignOut }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [query, setQuery] = useState('')
  const [collapsed, setCollapsed] = useState(false)
  const [view, setView] = useState('grouped')
  const [sort, setSort] = useState('name')

  const scrollRef = useRef(null)

  useEffect(() => {
    let alive = true
    getDashboard()
      .then(d => { if (alive) { setData(d); setLoading(false) } })
      .catch(() => { if (alive) { setFailed(true); setLoading(false) } })
    return () => { alive = false }
  }, [])

  const allTeams = useMemo(() => (data ? flattenTeams(data.workspaces) : []), [data])

  const visible = useMemo(
    () => sortTeams(filterTeams(allTeams, query), sort),
    [allTeams, query, sort],
  )

  // Scaled against everything the user has, not just what is on screen,
  // so the bars do not rescale as you type into the search.
  const largest = useMemo(() => largestTeam(allTeams), [allTeams])

  const rail = {
    active: 'teams',
    collapsed,
    user,
    onNavigate: id => (id === 'teams' ? undefined : onNavigate?.(id)),
    onSignOut,
  }

  const isReady = !loading && !failed

  return (
    <GlassShell {...rail}>
      <div className="dsh-main">
        <GlassTopbar
          scrollRef={scrollRef}
          ready={isReady}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(c => !c)}
          query={query}
          onQueryChange={setQuery}
          searchPlaceholder="Search teams and workspaces…"
          searchLabel="Search teams"
          user={user}
        >
          <button className="dsh-cta" onClick={() => onNavigate?.('dashboard')}>
            <span className="dsh-cta-text">Dashboard</span>
            <Chevron />
          </button>
        </GlassTopbar>

        <div className="dsh-scroll" ref={scrollRef}>
          <div className="dsh-crumbbar dsh-glass dsh-in">
            <h1 className="dsh-pagetitle">Teams</h1>
            <nav className="dsh-crumbs" aria-label="Breadcrumb">
              <span>Home</span><Chevron />
              <span className="dsh-crumb-now">Teams</span>
            </nav>
          </div>

          {failed && (
            <div className="dsh-center">
              <span style={{ fontSize: 26 }}>⚠️</span>
              <span>Couldn't load your teams.</span>
            </div>
          )}

          {!failed && data && !data.live && (
            <div className="dsh-banner dsh-in" style={{ '--in': '60ms' }}>
              <span>◇</span>
              Showing sample data — couldn't reach <code>GET /workspace/mine</code>.
            </div>
          )}

          {!failed && (
            <section className="dsh-panel dsh-glass dsh-in" style={{ '--in': '120ms' }}>
              <LibraryToolbar
                title="All teams"
                noun="team"
                flatLabel="All teams"
                count={visible.length}
                total={allTeams.length}
                sorts={SORTS}
                sort={sort}
                onSortChange={setSort}
                view={view}
                onViewChange={setView}
              />

              {loading && <LibraryGridSkeleton />}

              {!loading && allTeams.length === 0 && (
                <div className="dsh-empty">
                  No teams yet — create one from a workspace to get started.
                </div>
              )}

              {!loading && allTeams.length > 0 && visible.length === 0 && (
                <div className="dsh-empty">
                  No teams match “{query.trim()}”.
                </div>
              )}

              {!loading && visible.length > 0 && (
                // Re-keying on the arrangement restages the cascade, so
                // switching views reads as the grid rebuilding itself.
                <LibraryGrid
                  key={`${view}-${sort}`}
                  items={visible}
                  view={view}
                  noun="team"
                  getKey={team => `${team.workspaceId}-${team.id}`}
                  renderItem={(team, index, key) => (
                    <TeamCard key={key} team={team} index={index} largest={largest} />
                  )}
                />
              )}
            </section>
          )}
        </div>
      </div>
    </GlassShell>
  )
}
