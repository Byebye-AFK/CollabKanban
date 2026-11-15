import React, { useEffect, useMemo, useState } from 'react'
import AppShell from '../components/shell/AppShell'
import PageHeader from '../components/shell/PageHeader'
import GooeyInput from '../components/ui/GooeyInput'
import { WarnIcon } from '../components/shell/icons'
import LibraryToolbar from '../components/library/LibraryToolbar'
import LibraryGrid from '../components/library/LibraryGrid'
import LibraryGridSkeleton from '../components/library/LibraryGridSkeleton'
import BoardCard from '../components/boards/BoardCard'
import { getDashboard, getRecent } from '../api/dashboardApi'
import { flattenBoards, filterBoards, sortBoards, SORTS } from '../api/boardsApi'
import { getStarred, toggleStar } from '../api/starredApi'
import { useRailNavigate } from '../hooks/useRailNavigate'
import '../styles/library.css'

/**
 * The page both board libraries are made of — every board (Boards) or
 * only the starred ones (Starred).
 *
 * The two differ in their title, their empty state and which boards they
 * keep, and in nothing else, so they share this and pass the rest in.
 * Boards arrive inside GET /workspace/mine, so this reuses getDashboard()
 * rather than asking the server for them separately, and all of the
 * arranging — flatten, filter, sort, group — is pure and lives in
 * boardsApi.
 *
 * @param {Function} selectBoards  (allBoards, starredIds) => boards to show
 */
export default function BoardLibraryPage({
  user,
  onOpenBoard,
  onNavigate,
  onSignOut,
  railId,
  title,
  toolbarTitle,
  flatLabel,
  searchPlaceholder,
  searchLabel,
  emptyMessage,
  selectBoards = boards => boards,
}) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [query, setQuery] = useState('')
  const [collapsed, setCollapsed] = useState(false)
  const [view, setView] = useState('grouped')
  const [sort, setSort] = useState('name')
  // Seeded from storage, then kept here so a star redraws the row it was
  // pressed on — and drops the board off the page, when this is Starred.
  const [starredIds, setStarredIds] = useState(getStarred)

  useEffect(() => {
    let alive = true
    getDashboard()
      .then(d => { if (alive) { setData(d); setLoading(false) } })
      .catch(() => { if (alive) { setFailed(true); setLoading(false) } })
    return () => { alive = false }
  }, [])

  // Recents are read once per mount: they only change by opening a
  // board, which navigates away from this page anyway.
  const allBoards = useMemo(
    () => (data ? flattenBoards(data.workspaces, getRecent()) : []),
    [data],
  )

  const selected = useMemo(
    () => selectBoards(allBoards, starredIds),
    [allBoards, starredIds, selectBoards],
  )

  const visible = useMemo(
    () => sortBoards(filterBoards(selected, query), sort),
    [selected, query, sort],
  )

  const { navigate, toast } = useRailNavigate(railId, onNavigate)

  const openBoard = b => onOpenBoard?.(b.boardId, b.workspace, b.name)

  return (
    <AppShell
      active={railId}
      collapsed={collapsed}
      user={user}
      workspaces={data?.workspaces}
      onNavigate={navigate}
      onOpenBoard={onOpenBoard}
      onSignOut={onSignOut}
    >
      <PageHeader
        crumbs={[title]}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(c => !c)}
      >
        <GooeyInput
          value={query}
          onChange={setQuery}
          placeholder={searchPlaceholder}
          label={searchLabel}
          hotkey
        />
      </PageHeader>

      {failed ? (
        <div className="ui-state">
          <span className="ui-state-icon is-warn"><WarnIcon size={18} /></span>
          <span className="ui-state-title">Couldn't load your boards.</span>
        </div>
      ) : (
        <>
          <LibraryToolbar
            title={toolbarTitle}
            noun="board"
            flatLabel={flatLabel}
            count={visible.length}
            total={selected.length}
            sorts={SORTS}
            sort={sort}
            onSortChange={setSort}
            view={view}
            onViewChange={setView}
          />

          <div className="app-scroll">
            {data && !data.live && (
              <div className="ui-banner lib-banner">
                Showing sample data — couldn't reach <code>GET /workspace/mine</code>.
              </div>
            )}

            {loading && <LibraryGridSkeleton />}

            {!loading && selected.length === 0 && (
              <div className="ui-empty">{emptyMessage}</div>
            )}

            {!loading && selected.length > 0 && visible.length === 0 && (
              <div className="ui-empty">No boards match “{query.trim()}”.</div>
            )}

            {!loading && visible.length > 0 && (
              // Re-keying on the arrangement restages the cascade, so
              // switching views reads as the list rebuilding itself.
              <LibraryGrid
                key={`${view}-${sort}`}
                items={visible}
                view={view}
                noun="board"
                getKey={board => board.boardId}
                renderItem={(board, index, key) => (
                  <BoardCard
                    key={key}
                    board={board}
                    index={index}
                    onOpen={openBoard}
                    isStarred={starredIds.includes(board.boardId)}
                    onToggleStar={b => setStarredIds(toggleStar(b.boardId))}
                  />
                )}
              />
            )}
          </div>
        </>
      )}

      {toast && <div className="ui-toast" role="status">{toast}</div>}
    </AppShell>
  )
}
