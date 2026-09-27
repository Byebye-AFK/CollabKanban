import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import GlassShell from '../components/shell/GlassShell'
import GlassTopbar from '../components/shell/GlassTopbar'
import { Chevron } from '../components/shell/icons'
import LibraryToolbar from '../components/library/LibraryToolbar'
import LibraryGrid from '../components/library/LibraryGrid'
import LibraryGridSkeleton from '../components/library/LibraryGridSkeleton'
import TeamCard from '../components/teams/TeamCard'
import AddTeamMembersModal from '../components/teams/AddTeamMembersModal'
import CreateTeamModal from '../components/teams/CreateTeamModal'
import { getDashboard } from '../api/dashboardApi'
import {
  flattenTeams,
  filterTeams,
  sortTeams,
  largestTeam,
  canManageTeam,
  addTeamMembers,
  teamHomes,
  createTeam,
  SORTS,
} from '../api/teamsApi'
import { useRailNavigate } from '../hooks/useRailNavigate'
import './TeamsPage.css'

/**
 * TeamsPage — every team the user can reach, on one page.
 *
 * Teams arrive inside GET /workspace/mine, so this reuses
 * getDashboard() rather than asking the server separately, and shares
 * the Boards page's grid, toolbar and card shell.
 *
 * Owners and admins can create teams in their workspaces and add people
 * from a team's workspace to the team. Both are withheld on sample
 * data, where there is nothing to save to.
 */
const NOTICE_MS = 2600

function addedNotice(count, teamName) {
  return `Added ${count} member${count === 1 ? '' : 's'} to ${teamName}`
}

export default function TeamsPage({ user, onNavigate, onSignOut }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [query, setQuery] = useState('')
  const [collapsed, setCollapsed] = useState(false)
  const [view, setView] = useState('grouped')
  const [sort, setSort] = useState('name')
  const [addingTo, setAddingTo] = useState(null)
  const [isCreating, setIsCreating] = useState(false)
  const [notice, setNotice] = useState(null)

  const scrollRef = useRef(null)
  const aliveRef = useRef(true)

  const load = useCallback(() => (
    getDashboard()
      .then(d => { if (aliveRef.current) { setData(d); setLoading(false) } })
      .catch(() => { if (aliveRef.current) { setFailed(true); setLoading(false) } })
  ), [])

  useEffect(() => {
    aliveRef.current = true
    load()
    return () => { aliveRef.current = false }
  }, [load])

  useEffect(() => {
    if (!notice) return
    const t = setTimeout(() => setNotice(null), NOTICE_MS)
    return () => clearTimeout(t)
  }, [notice])

  const handleAddMembers = async (userIds) => {
    const team = addingTo
    const result = await addTeamMembers(team.id, userIds)
    if (result.added.length > 0) {
      setNotice(addedNotice(result.added.length, team.name))
      load()
    }
    return result
  }

  const homes = useMemo(() => (data?.live ? teamHomes(data.workspaces) : []), [data])

  const handleCreateTeam = async ({ name, workspaceId }) => {
    await createTeam({ name, workspaceId })
    const home = homes.find(w => w.workspaceId === workspaceId)
    setNotice(`Created ${name} in ${home?.name ?? 'the workspace'}`)
    load()
  }

  const allTeams = useMemo(() => (data ? flattenTeams(data.workspaces) : []), [data])

  const visible = useMemo(
    () => sortTeams(filterTeams(allTeams, query), sort),
    [allTeams, query, sort],
  )

  // Scaled against everything the user has, not just what is on screen,
  // so the bars do not rescale as you type into the search.
  const largest = useMemo(() => largestTeam(allTeams), [allTeams])

  const { navigate, toast } = useRailNavigate('teams', onNavigate)

  const rail = {
    active: 'teams',
    collapsed,
    user,
    onNavigate: navigate,
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
              >
                {homes.length > 0 && (
                  <button className="tms-add" onClick={() => setIsCreating(true)}>
                    New team
                  </button>
                )}
              </LibraryToolbar>

              {loading && <LibraryGridSkeleton />}

              {!loading && allTeams.length === 0 && (
                <div className="dsh-empty">
                  {homes.length > 0
                    ? 'No teams yet. Use New team to create one.'
                    : 'No teams yet. A workspace owner or admin can create one.'}
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
                    <TeamCard
                      key={key}
                      team={team}
                      index={index}
                      largest={largest}
                      onAddMembers={data.live && canManageTeam(team.role) ? setAddingTo : undefined}
                    />
                  )}
                />
              )}
            </section>
          )}
        </div>

        {addingTo && (
          <AddTeamMembersModal
            team={addingTo}
            onSubmit={handleAddMembers}
            onClose={() => setAddingTo(null)}
          />
        )}

        {isCreating && (
          <CreateTeamModal
            workspaces={homes}
            onSubmit={handleCreateTeam}
            onClose={() => setIsCreating(false)}
          />
        )}

        {(notice || toast) && <div className="dsh-toast" role="status">{notice || toast}</div>}
      </div>
    </GlassShell>
  )
}
