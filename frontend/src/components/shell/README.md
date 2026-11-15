# shell

## Overview
The signed-in application frame: the sidebar + main panel layout, the page header with breadcrumb, the shared stroke icon set (including column status icons), and the deterministic name→colour palette. Every signed-in page, the board included, renders inside `AppShell`.

## Interface
- `AppShell` (default export) `{ children, ...sidebarProps }` — renders `<Sidebar {...sidebarProps} />` plus `<main className="app-main">`; imports `styles/shell.css` [AppShell.jsx:AppShell]
- `Sidebar` (default export) `{ active = 'dashboard', collapsed, user, workspaces = [], activeBoardId, onNavigate, onOpenBoard, onSignOut }` [Sidebar.jsx:Sidebar]
- `NAV` — nav table: `dashboard`, `starred` (top level), `boards`, `teams`, `graph`, `workspaces` (group `'Workspace'`) [Sidebar.jsx:NAV]
- `PageHeader` (default export) `{ crumbs = [], collapsed, onToggleCollapse, children }` — crumbs are `string | {label, onClick?}`; last crumb is the current page [PageHeader.jsx:PageHeader]
- `Icon` `{ paths, size = 16, stroke = 1.7, children, ...svgProps }` and `GLYPHS` (path data keyed by nav id plus `signout`) [icons.jsx:Icon, GLYPHS]
- Named icons: `SearchIcon`, `Chevron`, `ChevronDown`, `SidebarIcon` (alias `CollapseIcon`), `CloseIcon`, `PlusIcon`, `MoreIcon`, `SortIcon` (alias `FilterIcon`), `DisplayIcon`, `BoardIcon`, `GroupIcon`, `GridIcon`, `ListIcon`, `StarIcon({filled})`, `TrashIcon`, `EyeOffIcon`, `EyeIcon`, `RefreshIcon`, `CheckIcon`, `CopyIcon`, `InviteIcon`, `WarnIcon`, `ArrowLeftIcon`, `UnassignedIcon` [icons.jsx]
- `StatusIcon` `{ status = STATUS.TODO, size = 14, className }` — glyph per `STATUS` from `src/api/boardStatus.js`, coloured by `--status-*` tokens, exposes `data-status` [icons.jsx:StatusIcon]
- `PALETTE` (six hex hues), `colorFor(name)`, `initials(name)` [palette.js]

## Invariants
- `colorFor` is a deterministic string hash into `PALETTE`, so a name keeps its hue across sorting/filtering [palette.js:colorFor]
- `initials` returns at most two upper-case letters [palette.js:initials]
- `StatusIcon` falls back to the TODO colour for unknown statuses [icons.jsx:StatusIcon]
- Collapsed sidebar is `aria-hidden` and `inert` [Sidebar.jsx:Sidebar]
- Only the workspace containing `activeBoardId` starts expanded in "Your workspaces"; the group is omitted when `workspaces` is empty [Sidebar.jsx:Sidebar, WorkspaceTree]
- New boards are created at `position: boards.length`; the cached workspace is updated (new board + joined team members) **before** opening, and the board auto-opens only when no member add failed — otherwise `{ failed, open }` is returned to `CreateBoardModal` [Sidebar.jsx:WorkspaceTree.handleCreate]
- Nav and Settings clicks call `onNavigate(id)`; board clicks call `onOpenBoard(boardId, workspace, boardName)` [Sidebar.jsx]

## Side Effects
- `WorkspaceTree.handleCreate` calls `createBoard` (`POST /board/create`, `src/api/boardApi.js`) and `addTeamMembers` (`POST /team/addMember` per user, `src/api/teamsApi.js`), then swaps the updated workspace into the module-level `/workspace/mine` cache via `cacheWorkspace` (`src/api/dashboardApi.js`) [Sidebar.jsx:WorkspaceTree]
- `AppShell` imports global stylesheet `styles/shell.css` [AppShell.jsx]
- `PageHeader`, `icons.jsx`, `palette.js`: none.

## Verification
- Run: `npm test -- src/components/shell` (from `frontend/`)
