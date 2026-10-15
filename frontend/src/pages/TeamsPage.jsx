import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import AppShell from '../components/shell/AppShell'
import PageHeader from '../components/shell/PageHeader'
import SearchField from '../components/shell/SearchField'
import { WarnIcon, PlusIcon } from '../components/shell/icons'
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
import '../styles/library.css'

/**
 * TeamsPage — every team the user can reach, on one page.
 *
 * Teams arrive inside GET /workspace/mine, so this reuses
 * getDashboard() rather than asking the server separately, and shares
 * the Boards page's list, toolbar and row shell.
 *
 * Owners and admins can create teams in their workspaces and add people
 * from a team's workspace to the team. Both are withheld on sample
 * data, where there is nothing to save to.
 */
const NOTICE_MS = 2600

function addedNotice(count, teamName) {
  return `Added ${count} member${count === 1 ? '' : 's'} to ${teamName}`
}

export default function TeamsPage({ user, onNavigate, onOpenBoard, onSignOut }) {
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

  return (
    <AppShell
      active="teams"
      collapsed={collapsed}
      user={user}
      workspaces={data?.workspaces}
      onNavigate={navigate}
      onOpenBoard={onOpenBoard}
      onSignOut={onSignOut}
    >
      <PageHeader
        crumbs={['Teams']}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(c => !c)}
      >
        <SearchField
          value={query}
          onChange={setQuery}
          placeholder="Search teams and workspaces…"
          label="Search teams"
          hotkey
        />
      </PageHeader>

      {failed ? (
        <div className="ui-state">
          <span className="ui-state-icon is-warn"><WarnIcon size={18} /></span>
          <span className="ui-state-title">Couldn't load your teams.</span>
        </div>
      ) : (
        <>
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
              <button className="ui-btn is-primary" onClick={() => setIsCreating(true)}>
                <PlusIcon size={12} />
                New team
              </button>
            )}
          </LibraryToolbar>

          <div className="app-scroll">
            {data && !data.live && (
              <div className="ui-banner lib-banner">
                Showing sample data — couldn't reach <code>GET /workspace/mine</code>.
              </div>
            )}

            {loading && <LibraryGridSkeleton />}

            {!loading && allTeams.length === 0 && (
              <div className="ui-empty">
                {homes.length > 0
                  ? 'No teams yet. Use New team to create one.'
                  : 'No teams yet. A workspace owner or admin can create one.'}
              </div>
            )}

            {!loading && allTeams.length > 0 && visible.length === 0 && (
              <div className="ui-empty">No teams match “{query.trim()}”.</div>
            )}

            {!loading && visible.length > 0 && (
              // Re-keying on the arrangement restages the cascade, so
              // switching views reads as the list rebuilding itself.
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
          </div>
        </>
      )}

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

      {(notice || toast) && <div className="ui-toast" role="status">{notice || toast}</div>}
    </AppShell>
  )
}
