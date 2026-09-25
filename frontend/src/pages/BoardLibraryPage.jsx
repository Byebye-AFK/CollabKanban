import React, { useEffect, useMemo, useRef, useState } from 'react'
import GlassShell from '../components/shell/GlassShell'
import GlassTopbar from '../components/shell/GlassTopbar'
import { Chevron } from '../components/shell/icons'
import LibraryToolbar from '../components/library/LibraryToolbar'
import LibraryGrid from '../components/library/LibraryGrid'
import LibraryGridSkeleton from '../components/library/LibraryGridSkeleton'
import BoardCard from '../components/boards/BoardCard'
import { getDashboard, getRecent } from '../api/dashboardApi'
import { flattenBoards, filterBoards, sortBoards, SORTS } from '../api/boardsApi'
import { getStarred, toggleStar } from '../api/starredApi'
import { useRailNavigate } from '../hooks/useRailNavigate'
import './BoardsPage.css'

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
  // Seeded from storage, then kept here so a star redraws the card it was
  // pressed on — and drops the board off the page, when this is Starred.
  const [starredIds, setStarredIds] = useState(getStarred)

  const scrollRef = useRef(null)

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

  const rail = {
    active: railId,
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
          searchPlaceholder={searchPlaceholder}
          searchLabel={searchLabel}
          user={user}
        >
          <button className="dsh-cta" onClick={() => onNavigate?.('dashboard')}>
            <span className="dsh-cta-text">Dashboard</span>
            <Chevron />
          </button>
        </GlassTopbar>

        <div className="dsh-scroll" ref={scrollRef}>
          <div className="dsh-crumbbar dsh-glass dsh-in">
            <h1 className="dsh-pagetitle">{title}</h1>
            <nav className="dsh-crumbs" aria-label="Breadcrumb">
              <span>Home</span><Chevron />
              <span className="dsh-crumb-now">{title}</span>
            </nav>
          </div>

          {failed && (
            <div className="dsh-center">
              <span style={{ fontSize: 26 }}>⚠️</span>
              <span>Couldn't load your boards.</span>
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

              {loading && <LibraryGridSkeleton />}

              {!loading && selected.length === 0 && (
                <div className="dsh-empty">{emptyMessage}</div>
              )}

              {!loading && selected.length > 0 && visible.length === 0 && (
                <div className="dsh-empty">
                  No boards match “{query.trim()}”.
                </div>
              )}

              {!loading && visible.length > 0 && (
                // Re-keying on the arrangement restages the cascade, so
                // switching views reads as the grid rebuilding itself.
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
                      onOpen={b => onOpenBoard?.(b.boardId, b.workspace, b.name)}
                      isStarred={starredIds.includes(board.boardId)}
                      onToggleStar={b => setStarredIds(toggleStar(b.boardId))}
                    />
                  )}
                />
              )}
            </section>
          )}
        </div>

        {toast && <div className="dsh-toast">{toast}</div>}
      </div>
    </GlassShell>
  )
}
