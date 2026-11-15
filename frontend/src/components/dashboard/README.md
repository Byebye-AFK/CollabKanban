# dashboard

## Overview
Sections of the dashboard page: the headline stat row, a canvas force-directed graph of you → workspaces → teams, and the workspace table. All take normalised workspaces (from `getDashboard()` in `src/api/dashboardApi.js`) as props and fetch nothing.

## Interface
- `StatCards` (default export) `{ stats, workspaces, onOpenWorkspace, onOpenBoard }` — reads `stats.{ teamCount, boardCount, openCards, lastWorkspace, lastVisitedBoard, lastVisitedLabel }`; renders Workspaces, Teams (with per-workspace bars), Last workspace, Last board [StatCards.jsx:StatCards]
- `GraphView` (default export) `{ workspaces, userName, onSelectWorkspace }` — scope select (`'all'` or a workspace id) and a "Re-layout" button [GraphView.jsx:GraphView]
- `WorkspaceList` (default export) `{ workspaces, onOpenWorkspace, onCreateWorkspace }` — table sortable by `name` or `boards` [WorkspaceList.jsx:WorkspaceList, SORTS]

## Invariants
- Each workspace must provide `teams`, `boards`, `members` arrays, `name`, `workspaceId` and (for `WorkspaceList`) `role`; teams need `id`, `name`, `memberCount` [GraphView.jsx:buildGraph, WorkspaceList.jsx, StatCards.jsx]
- "Last workspace"/"Last board" cells are clickable only when the target exists [StatCards.jsx:StatCards]
- Team bars scale against the workspace with the most teams (`max(1, …)`), never a fixed ceiling [StatCards.jsx:maxTeams]
- `WorkspaceList` sorts a copy, never the `workspaces` prop [WorkspaceList.jsx:rows]
- Graph: only workspace nodes are clickable (`onSelectWorkspace(ws)`); node ids are `me`, `w{workspaceId}`, `w{workspaceId}-{teamId}`; node radius grows with team count / member count (capped); nodes are clamped inside the canvas [GraphView.jsx:buildGraph, physics, onClick]
- Graph colours are hard-coded hex mirroring `styles/tokens.css` because canvas cannot read CSS variables (the documented exception to the tokens rule) [GraphView.jsx:Palette]
- The animation loop parks when `alpha <= ALPHA_MIN` and nothing is hovered or dragged [GraphView.jsx:loop]

## Side Effects
- `GraphView` runs `requestAnimationFrame`, a `ResizeObserver` on its wrapper, canvas mouse listeners and a `window` `mouseup` listener; all are removed on unmount [GraphView.jsx:GraphView]
- `WorkspaceList` sort menu uses `useDismiss` (`document` `pointerdown`/`keydown` while open) [WorkspaceList.jsx]
- No network or storage access.

## Verification
- No tests exist in this directory yet; run the full suite: `npm test` (from `frontend/`)
