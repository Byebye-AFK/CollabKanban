# pages

## Overview

Top-level page components that `App` renders one at a time (there is no
router). Every signed-in page renders inside `AppShell` (sidebar + main
panel) with a `PageHeader`; the signed-out `LandingPage` does not. Pages
stay thin: data comes from `src/api/*` and `src/hooks/*`, and the arranging
(flatten, filter, sort, partition) is delegated to pure functions there.

| Page | Role |
|---|---|
| `LandingPage` | Signed-out front door with an animated board preview |
| `DashboardPage` | Signed-in home: greeting, stats, graph, workspace list |
| `BoardsPage` / `StarredPage` | Thin configurations of `BoardLibraryPage` |
| `BoardLibraryPage` | Shared board list (grouped/flat, search, sort, stars) |
| `TeamsPage` | Team list, create team, add team members |
| `BoardPage` | One Kanban board with views, hidden columns, Display options and live updates |

## Interface

All pages are default exports.

- `LandingPage({ onOpenBoard, onLogin })`: both callbacks are wired to the "Get started" and "Sign in" buttons. Local, non-exported helpers: `Brand`, `DrawIcon`, `PreviewCard`, `TravellingCard`, `BoardPreview`, plus the constants `HEADLINE`, `WORD_STAGGER_MS`, `FEATURES`, `PREVIEW` [LandingPage.jsx:LandingPage]
- `DashboardPage({ user, onOpenBoard, onNavigate, onSignOut, initialSection = null, onSectionShown, animateGreeting = false, onGreeted })` [DashboardPage.jsx:DashboardPage]
  - Module constants: `SECTION_LABEL` (`dashboard`/`graph`/`workspaces`), `OTHER_PAGES = ['boards', 'starred', 'teams']`, `SECTION_SCROLL_GAP = 12`, `COPIED_RESET_MS = 1600`, `TOAST_MS = 2200`. Local helper: `greeting(date)` [DashboardPage.jsx:SECTION_LABEL]
- `BoardLibraryPage({ user, onOpenBoard, onNavigate, onSignOut, railId, title, toolbarTitle, flatLabel, searchPlaceholder, searchLabel, emptyMessage, selectBoards = boards => boards })`: `selectBoards(allBoards, starredIds)` chooses which boards to show [BoardLibraryPage.jsx:BoardLibraryPage]
- `BoardsPage(props)`: `BoardLibraryPage` with `railId="boards"` and the default `selectBoards` [BoardsPage.jsx:BoardsPage]
- `StarredPage(props)`: `BoardLibraryPage` with `railId="starred"` and `selectBoards={filterStarred}` from `../api/starredApi` [StarredPage.jsx:StarredPage]
- `TeamsPage({ user, onNavigate, onOpenBoard, onSignOut })`. Module constant `NOTICE_MS = 2600`, local helper `addedNotice(count, teamName)` [TeamsPage.jsx:TeamsPage]
- `BoardPage({ boardId, boardName, workspace, user, onBack, backLabel, onOpenBoard, onNavigate, onSignOut })`. Local helper `countMatches(columns, query)` returns `null` for an empty query, otherwise `"N match(es)"` across card `title`/`description` [BoardPage.jsx:BoardPage, BoardPage.jsx:countMatches]
- Callback contract used across pages: `onOpenBoard(boardId, workspace, name?)`. `BoardLibraryPage` passes all three [BoardLibraryPage.jsx:openBoard]. The dashboard workspace modal passes `(b.boardId, openWs)` [DashboardPage.jsx:DashboardPage]. `onNavigate(id)` receives a sidebar rail id.
- Dependencies: [`src/api/`](../api/README.md), [`src/hooks/`](../hooks/README.md), [`src/components/`](../components/README.md). Tests live in `./__tests__/` (`BoardsPage.test.jsx`, `StarredPage.test.jsx`, `TeamsPage.test.jsx`).

## Invariants

- **No separate list fetches.** `DashboardPage`, `BoardLibraryPage` and `TeamsPage` all get their data from `getDashboard()` (`GET /workspace/mine`). Boards and teams are derived on the client with `flattenBoards` / `flattenTeams` [BoardLibraryPage.jsx:useEffect, TeamsPage.jsx:load, DashboardPage.jsx:useEffect]
- **`BoardPage` makes no workspace fetch.** Its sidebar uses `getCachedWorkspaces()` [BoardPage.jsx:AppShell workspaces]
- **Sample-data banner.** When `data.live` is false, the Dashboard, board library and Teams pages show "Showing sample data — couldn't reach `GET /workspace/mine`" [BoardLibraryPage.jsx:ui-banner, TeamsPage.jsx:ui-banner, DashboardPage.jsx:ui-banner]
- **Writes are blocked on sample data.** `TeamsPage` computes `homes` (create-team targets) only when `data.live`. It passes `onAddMembers` only when `data.live && canManageTeam(team.role)`. The "New team" button shows only when `homes.length > 0` [TeamsPage.jsx:homes, TeamsPage.jsx:TeamCard onAddMembers]
- **No state updates after unmount.** Async loads check an `alive` flag (`BoardLibraryPage`, `DashboardPage`) or `aliveRef` (`TeamsPage`) before calling `setState` [BoardLibraryPage.jsx:useEffect, TeamsPage.jsx:aliveRef]
- **Empty vs. no-match states differ.** "Nothing selected" (`emptyMessage`) is a different state from "No boards/teams match …" [BoardLibraryPage.jsx:ui-empty, TeamsPage.jsx:ui-empty]
- **Stable bar scale.** `TeamsPage` scales its bars with `largestTeam(allTeams)` over all teams, not over the filtered list, so the bars do not rescale while searching [TeamsPage.jsx:largest]
- **Stars are page state seeded from storage.** `starredIds` starts as `getStarred()` and is replaced with the return value of `toggleStar(boardId)`, so on Starred an unstarred board drops off the list immediately [BoardLibraryPage.jsx:starredIds]
- **Recents are read once per load.** `getRecent()` is read only when `data` changes [BoardLibraryPage.jsx:allBoards]
- **Grid re-keying.** `LibraryGrid` is keyed by `` `${view}-${sort}` `` so a change of arrangement remounts it and replays the animation [BoardLibraryPage.jsx:LibraryGrid, TeamsPage.jsx:LibraryGrid]
- **Dashboard sidebar highlight follows scroll.** The active rail id comes from `useScrollSpy(scrollRef, sections, ...)`. `navigate` never sets it directly [DashboardPage.jsx:nav, DashboardPage.jsx:navigate]
- **Dashboard rail routing.** `graph` / `workspaces` / `dashboard` scroll inside the page. Ids in `OTHER_PAGES` go to `onNavigate`. Any other id shows a "`<Id>` is coming next" toast [DashboardPage.jsx:navigate]
- **Dashboard scrolling.** `scrollToSection` scrolls only the content container (`scrollRef`), never `scrollIntoView`, so the shell does not move [DashboardPage.jsx:scrollToSection]
- **`initialSection` runs once.** It is honored only after data loads, and then `onSectionShown()` is called so App clears it [DashboardPage.jsx:useEffect initialSection]
- **Greeting animation is fixed at mount.** `animateGreeting` is captured once in `useState`, and `onGreeted()` fires once on mount [DashboardPage.jsx:shouldAnimateGreeting]
- **Honest invite toast.** "Invite link copied" is shown only when `copyInvite()` resolves `true` [DashboardPage.jsx:copyInvite]
- **Board column pipeline order.** `partitionColumns(allColumns, hiddenIds)` runs first, then `filterColumnsByView(shown, view)`, then empty columns are dropped unless `display.showEmptyColumns` is set. The match count is computed over **all** columns [BoardPage.jsx:columns, BoardPage.jsx:matchLabel]
- **Board lifecycle.** When `boardId` changes, `BoardPage` calls `loadBoard(boardId)` and `connectBoardSocket(boardId)` and re-reads `getHidden(boardId)`. Cleanup calls `disconnectBoardSocket()` [BoardPage.jsx:useEffect]
- **Offline indicator.** An "Offline" status is shown only when `!isLive` [BoardPage.jsx:brd-live-off]
- **Board team management.** "Add people" is offered only when `canManage` from `useBoardTeam(workspace, board?.teamId)` is true [BoardPage.jsx:BoardMembers]
- **Board title fallback order:** `board.name` → `boardName` prop → `` `Board ${boardId}` `` → `'Board'` [BoardPage.jsx:title]

## Side Effects

- **Network (through api/hooks, never directly):**
  - `getDashboard()` on mount in `DashboardPage`, `BoardLibraryPage` and `TeamsPage`. `TeamsPage` also calls it again after a successful add or create [TeamsPage.jsx:load]
  - `addTeamMembers(team.id, userIds)` and `createTeam({ name, workspaceId })` [TeamsPage.jsx:handleAddMembers, TeamsPage.jsx:handleCreateTeam]
  - Board REST calls and the STOMP subscription through `useBoard()`: `loadBoard`, `connectBoardSocket`, `addColumn`, `addCard`, `moveCard`, `deleteCard`, `deleteColumn` [BoardPage.jsx:useBoard]. Team member adds go through `useBoardTeam().addMembers` [BoardPage.jsx:useBoardTeam]
- **localStorage (through api modules):**
  - Stars: `getStarred` / `toggleStar` [BoardLibraryPage.jsx:starredIds]
  - Recents: `getRecent` [BoardLibraryPage.jsx:allBoards]
  - Hidden columns and Display options: `getHidden` / `toggleHidden` / `getDisplay` / `setDisplay` [BoardPage.jsx:toggleColumn, BoardPage.jsx:changeDisplay]
- **Clipboard:** `navigator.clipboard.writeText(inviteLink)`. The link is `${window.location.origin}/invite/<email-local-part or 'guest'>-wk21` [DashboardPage.jsx:copyInvite, DashboardPage.jsx:inviteLink]
- **Timers:**
  - Toast auto-dismiss after `TOAST_MS` [DashboardPage.jsx:useEffect toast] and notice auto-dismiss after `NOTICE_MS` [TeamsPage.jsx:useEffect notice]. Both timeouts are cleared on cleanup.
  - The copied-state reset after `COPIED_RESET_MS` is **not** cleared [DashboardPage.jsx:copyInvite]
- **DOM / animation (`LandingPage`):**
  - A pointer-tilt `requestAnimationFrame` loop writes `--px` / `--py` on the hero element. It is skipped under `prefers-reduced-motion: reduce`.
  - `IntersectionObserver`s add `is-in` to `.lp-rise`, toggle `is-stuck` on the nav and `is-paused` on the preview.
  - All listeners, observers and the animation frame are removed on unmount [LandingPage.jsx:LandingPage useEffect]
- **DOM (`DashboardPage`):** smooth `scrollTo` on the content container, and `useDecryptTree(scrollRef, ...)` on a fresh login [DashboardPage.jsx:scrollToSection, DashboardPage.jsx:useDecryptTree]

## Verification

- Run: `npm test -- src/pages` (from `frontend/`; Vitest). Full suite: `npm test`.
