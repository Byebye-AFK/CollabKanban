# src

## Overview

Source root of the CollabKanban React 18 + Vite frontend. `main.jsx` mounts
`App` inside `StrictMode`. `App.jsx` handles navigation itself, with no
router: it holds the signed-in user, the current view and the open board, and
renders one page at a time. Data access and derivation live in `api/`, shared
stateful behaviour in `hooks/`, page composition in `pages/`, and reusable UI
in `components/`.

## Interface

### Local files

- `main.jsx`: `createRoot(document.getElementById('root')).render(<StrictMode><App /></StrictMode>)`,
  and imports `./index.css` [main.jsx].
- `App` (default export) [App.jsx:App]: the top-level view switch.
  - Signed out → `LandingPage`, plus `LoginModal` while `loginOpen` is set.
  - `user && activeBoardId` → `BoardPage`.
  - `view === 'boards' | 'starred' | 'teams'` → `BoardsPage` / `StarredPage` / `TeamsPage`.
  - Otherwise → `DashboardPage`, with `initialSection`, `onSectionShown`,
    `animateGreeting` and `onGreeted`.
- Constants [App.jsx]: `PAGES = ['dashboard','boards','starred','teams']`,
  `DASHBOARD_SECTIONS = ['graph','workspaces']`, and `BACK_LABEL` (the board's
  Back label, chosen by `view`).
- Callbacks passed to pages [App.jsx]:
  - `openBoard(id, workspace, boardName)` opens a board and calls `rememberVisit`.
  - `navigate(id)` moves between pages and dashboard sections.
  - `backToDashboard()`, `signOut()`, and `handleLogin(signedInUser)`.

### Subdirectories

- [api](./api/README.md): REST, STOMP and localStorage boundary, plus pure derivation helpers.
- [components](./components/README.md): Kanban board UI, dialogs, shell, library, dashboard and teams components.
- [hooks](./hooks/README.md): `useBoard`, `useBoardTeam`, `useDecryptTree`, `useDismiss`, `useRailNavigate` and `useScrollSpy`.
- [pages](./pages/README.md): the top-level pages `App` switches between.
- `styles/`: plain CSS tokens and shared primitives (no contract; CSS only).
- `test/setup.js`: Vitest setup file (test-only; no contract).

## Invariants

- On mount, the OAuth callback wins over the stored session:
  `consumeOauthCallback() || getStoredUser()`. An OAuth sign-in sets
  `isWelcomePending` so the greeting plays once [App.jsx:useEffect].
- `openBoard` ignores ids that fail `parseInt` or are `<= 0`. The board name
  comes from `boardName`, then the workspace's board `name`, then `Board ${id}` [App.jsx:openBoard].
- An open board takes priority over `view`. `navigate` to any page or
  dashboard section closes the open board first [App.jsx:navigate].
- `navigate` handles only ids in `PAGES` or `DASHBOARD_SECTIONS`. Other ids do
  nothing here, and the calling page is expected to report them, for example
  with the "coming next" toast in `hooks/useRailNavigate.js` [App.jsx:navigate].
- A dashboard section asked for from another page is stored in
  `pendingSection` and cleared once the dashboard reports it as shown
  [App.jsx:navigate, onSectionShown].
- `signOut` clears the session, resets `view` to `'dashboard'`, and closes any open board [App.jsx:signOut].

## Side Effects

- `consumeOauthCallback()` reads `#token=` (falling back to `?token=`) on
  `/oauth2/callback`, persists the session and rewrites the URL. `signOut()` clears `jwt_token` / `kanban_user`
  from localStorage [App.jsx → api/authApi.js].
- `rememberVisit()` writes the recently opened board to `kanban_recent` in
  localStorage [App.jsx:openBoard → api/dashboardApi.js].
- Mounts the React tree into `#root` [main.jsx].

## Verification

- Run: `npm test` (from `frontend/`)
