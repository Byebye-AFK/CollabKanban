# CollabKanban Frontend Blueprint

## System Overview

React 18 + Vite 5 single-page app for CollabKanban, written in plain
JavaScript/JSX (no TypeScript, router or state library). It talks to the
Spring Boot backend at `http://localhost:8080`: REST for every write, and a
receive-only STOMP socket on `ws://localhost:8080/ws` for live board updates.
The dev server runs on `http://localhost:5173`, the only origin the backend's
CORS policy allows.

```text
main.jsx ─► App (view switch, no router)
              ├─ pages/        LandingPage · DashboardPage · BoardsPage/StarredPage (BoardLibraryPage) · TeamsPage · BoardPage
              │     └─ components/  shell · board · boards · library · dashboard · teams · ui · Kanban stage
              ├─ hooks/        useBoard (REST + STOMP) · useBoardTeam · UI hooks
              └─ api/          REST clients ──► http://localhost:8080
                               socket.js   ──► ws://localhost:8080/ws  (/topic/board/{boardId}, receive-only)
                               localStorage (jwt_token, kanban_user, kanban_recent, kanban_starred,
                                             kanban_hidden_columns, kanban_board_display)
```

## Local Interface & Invariants

- `package.json` scripts: `dev` (`vite`), `build`, `preview`, `test`
  (`vitest run`), `test:watch`, and `test:coverage` (`vitest run --coverage`).
  Runtime dependencies are only `react`, `react-dom` and `@stomp/stompjs`.
- `vite.config.js`:
  - The dev server runs on `port: 5173`, and proxies `/board`, `/boards` and
    `/cards` to `http://localhost:8080`. The api modules call
    `http://localhost:8080` directly, so they do not use this proxy.
  - Vitest uses `environment: 'jsdom'`, `globals: true`,
    `setupFiles: './src/test/setup.js'` and `css: false`.
  - Coverage uses the `v8` provider with 80% thresholds for lines, functions,
    branches and statements. It covers only the files listed in
    `coverage.include`. Add newly tested files to that list rather than
    widening it to untested legacy code.

## Subdirectories & System Boundaries

- src: [./src/README.md](./src/README.md) - `main.jsx` and the `App` view
  switch, which coordinates the four packages below.
  - api: [./src/api/README.md](./src/api/README.md) - the only boundary with
    the backend and browser storage. It has REST clients (`authApi`,
    `boardApi`, `dashboardApi`, `teamsApi`), `parseApiError`, the singleton
    receive-only STOMP client (`socket.js`), and pure derivations (`boardsApi`,
    `boardStatus`, `library`, `teamsApi`). Stars, hidden columns, display
    options and recent boards are kept in the browser.
  - hooks: [./src/hooks/README.md](./src/hooks/README.md) - `useBoard`
    (optimistic add/move/delete with rollback, a resync on 409, and a refetch
    on every broadcast), `useBoardTeam`, and UI hooks (`useDismiss`,
    `useScrollSpy`, `useRailNavigate`, `useDecryptTree`).
  - pages: [./src/pages/README.md](./src/pages/README.md) - top-level pages.
    Signed-in pages render inside `AppShell` and get their lists from
    `getDashboard()`.
  - components: [./src/components/README.md](./src/components/README.md) -
    the Kanban stage (`KanbanBoard` → `KanbanColumn` → `TaskCard`), dialogs,
    and the child packages [board](./src/components/board/README.md),
    [boards](./src/components/boards/README.md),
    [dashboard](./src/components/dashboard/README.md),
    [library](./src/components/library/README.md),
    [shell](./src/components/shell/README.md),
    [teams](./src/components/teams/README.md) and
    [ui](./src/components/ui/README.md).
- loadtest: [./loadtest/README.md](./loadtest/README.md) - standalone k6
  (`kanban.js`) and Node (`race.mjs`) scripts that load the backend API. They
  are not part of the app bundle or the Vitest suite.

## Global Invariants

- Every write goes over REST. The STOMP socket only receives, and any
  broadcast on `/topic/board/{boardId}`, or any reconnect, triggers a full
  board refetch [api/socket.js, hooks/useBoard.js].
- Authenticated requests send `Authorization: Bearer <localStorage.jwt_token>`
  only when a token exists [api/boardApi.js, api/dashboardApi.js, api/teamsApi.js].
- Boards, Teams, Starred and the board sidebar reuse `getDashboard()` /
  `getCachedWorkspaces()`; there are no separate list endpoints. When
  `/workspace/mine` fails, `getDashboard()` returns demo data with
  `live: false`. The Dashboard, board library and Teams pages then show a
  sample-data banner, and `TeamsPage` disables creating teams and adding
  members [api/dashboardApi.js, pages/README.md].
- A 409 from `PUT /card/move/{id}` is an optimistic-lock conflict. Like any
  failed move it is rolled back and the error is rethrown; additionally the
  board is resynced with `loadBoard`, because the snapshot is stale too
  [hooks/useBoard.js:moveCard].
- Updates to shared state are immutable: helpers and hooks return new
  arrays/objects [api/, hooks/useBoard.js].
- localStorage access is wrapped in try/catch and falls back to defaults
  [api/boardPrefsApi.js, api/starredApi.js, api/dashboardApi.js].
- Team management (adding members, the people list in Create board) is
  offered only to the `OWNER` / `ADMIN` roles through `canManageTeam` [api/teamsApi.js].

## Global Side Effects

- Backend REST calls to `http://localhost:8080`:
  - `/user/login` and `/user/add`
  - `/workspace/mine`
  - `/board/create` and `/board/{id}`
  - `/column/create` and `/column/{id}`
  - `/card/create`, `/card/move/{id}` and `/card/{id}`
  - `/team/add` and `/team/addMember`
- Google OAuth redirects to `/oauth2/authorization/google`; the callback
  arrives at `/oauth2/callback?token=` [api/authApi.js].
- Uses a STOMP WebSocket at `ws://localhost:8080/ws`, which reconnects every
  5000 ms [api/socket.js].
- Browser localStorage keys: `jwt_token`, `kanban_user`, `kanban_recent`,
  `kanban_starred`, `kanban_hidden_columns` and `kanban_board_display`.
- `loadtest/` scripts create real users, workspaces, boards, cards and teams
  in the target backend, and nothing cleans them up.

## System Verification

- Run: `npm test` (from `frontend/`)
- Coverage: `npm run test:coverage`
