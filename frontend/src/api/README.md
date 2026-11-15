# api

## Overview

`src/api/` is the frontend's single boundary with the Spring Boot backend and
with browser storage. It holds three kinds of module:

- **REST clients** (`authApi`, `boardApi`, `dashboardApi`, `teamsApi`) that call
  `http://localhost:8080` directly and turn failures into `Error`s through
  `apiError`.
- **A receive-only STOMP client** (`socket`) for live board updates.
- **Pure derivation and browser-only state** (`boardsApi`, `boardStatus`,
  `library`, `starredApi`, `boardPrefsApi`). These cover things the backend
  does not model: column status, card keys, progress, stars, view preferences,
  and recent boards.

Components and hooks import from here. They do not call `fetch`, `localStorage`
or STOMP themselves for these concerns.

## Interface

### `apiError.js`

- `parseApiError(res)` is async. It reads the body of a failed `Response` and
  returns an `Error` with `.status` set. The message is the body's `message`,
  then its `error`, then the raw text, then `Request failed with status N`.
  [apiError.js:parseApiError]

### `authApi.js`

- `login(email, password)` calls `POST /user/login` with `{email, password}`.
  It reads the JWT from the response text, persists the session and resolves
  to `{email, name}`. [authApi.js:login]
- `signUp(name, email, password)` calls `POST /user/add` and then
  `login(email, password)`. [authApi.js:signUp]
- `signInWithGoogle()` sets `window.location.href` to
  `${BASE_URL}/oauth2/authorization/google`. [authApi.js:signInWithGoogle]
- `consumeOauthCallback()` runs only when the path is `/oauth2/callback`. It
  reads the token from the URL fragment `#token=` (falling back to `?token=`
  for an older backend), persists the session, replaces the URL with `/` and returns
  the user. Otherwise it returns `null`. [authApi.js:consumeOauthCallback]
- `getStoredUser()` returns the parsed `kanban_user`, or `null`.
  [authApi.js:getStoredUser]
- `signOut()` removes `jwt_token` and `kanban_user`. [authApi.js:signOut]

### `boardApi.js`

All calls go through the private `request()`. It returns `null` for a 204 and
the parsed JSON otherwise. [boardApi.js:request]

- `getBoard(boardId)`: `GET /board/{boardId}`. [boardApi.js:getBoard]
- `createBoard({name, workspaceId, teamId, position = 0})`: `POST /board/create`.
  [boardApi.js:createBoard]
- `createColumn(columnPayload)`: `POST /column/create`. [boardApi.js:createColumn]
- `deleteColumn(columnId)`: `DELETE /column/{columnId}`. [boardApi.js:deleteColumn]
- `createCard(payload)`: `POST /card/create`. [boardApi.js:createCard]
- `moveCard(cardId, targetColumnId, position, version)`: `PUT /card/move/{cardId}`
  with body `{targetColumnId, position}`, plus `version` when it is not null.
  The server answers 409 if that version is stale. [boardApi.js:moveCard]
- `deleteCard(cardId)`: `DELETE /card/{cardId}`. [boardApi.js:deleteCard]

Some JSDoc comments in this file name other routes, such as
`POST /boards/{boardId}/columns`, `PATCH /cards/{cardId}/move` and
`DELETE /cards/{cardId}`. The paths in the code are the ones listed above and
are the ones actually requested.

### `boardPrefsApi.js`

- Constants: `HIDDEN_KEY` (`'kanban_hidden_columns'`), `DISPLAY_KEY`
  (`'kanban_board_display'`), and `DEFAULT_DISPLAY`. `DEFAULT_DISPLAY` is
  frozen as `{showDescriptions: true, showEmptyColumns: true}`.
  [boardPrefsApi.js:HIDDEN_KEY, DISPLAY_KEY, DEFAULT_DISPLAY]
- `getHidden(boardId)` and `toggleHidden(boardId, columnId)` read and toggle a
  board's hidden column ids. [boardPrefsApi.js:getHidden, toggleHidden]
- `partitionColumns(columns, hiddenIds)` returns `{shown, hidden}` and keeps
  board order. [boardPrefsApi.js:partitionColumns]
- `getDisplay()` and `setDisplay(change)` read and update the display options.
  [boardPrefsApi.js:getDisplay, setDisplay]

### `boardStatus.js`

- `STATUS` is frozen with the values `backlog`, `todo`, `started`, `done` and
  `canceled`. [boardStatus.js:STATUS]
- `columnStatus(name)` maps a column name to a `STATUS` value.
  [boardStatus.js:columnStatus]
- `boardPrefix(name)` returns up to three capital letters, or `'CK'`.
  `cardKey(boardName, cardId)` returns a key such as `PR-128`.
  [boardStatus.js:boardPrefix, cardKey]
- `BOARD_VIEWS` lists the views `all`, `active` and `backlog`.
  `filterColumnsByView(columns, view)` returns the columns a view shows.
  [boardStatus.js:BOARD_VIEWS, filterColumnsByView]

### `boardsApi.js`

- `boardProgress(board)` returns `{known, total, done, columnCount}`.
  [boardsApi.js:boardProgress]
- `progressPercent(progress)` returns a whole-number percentage.
  [boardsApi.js:progressPercent]
- `flattenBoards(workspaces, recent)` returns one entry per board, with
  workspace context and `lastVisitedAt`. [boardsApi.js:flattenBoards]
- `SORTS` holds the sort ids `name`, `cards`, `workspace` and `recent`.
  `sortBoards(boards, sortId)` and `filterBoards(boards, query)` sort and
  search the list. [boardsApi.js:SORTS, sortBoards, filterBoards]

### `dashboardApi.js`

- `getDashboard()` calls `GET /workspace/mine` and resolves to
  `{workspaces, stats, live}`. [dashboardApi.js:getDashboard]
- `normalizeWorkspace(workspace, index)` maps the Spring DTO to
  `{workspaceId, name, role, members, people, teams, boards}`.
  [dashboardApi.js:normalizeWorkspace]
- `getCachedWorkspaces()`, `cacheWorkspace(workspace)` and
  `withBoard(workspaces, workspaceId, board)` work on the workspaces loaded by
  the last `getDashboard()`.
  [dashboardApi.js:getCachedWorkspaces, cacheWorkspace, withBoard]
- `rememberVisit(entry)`, `getRecent()` and `relativeTime(ts)` handle recently
  visited boards. [dashboardApi.js:rememberVisit, getRecent, relativeTime]

### `library.js`

- `filterBy(items, query, fields)`, `sortBy(items, comparators, id, fallbackId)`
  and `groupByWorkspace(items)` are shared by the Boards and Teams pages.
  [library.js:filterBy, sortBy, groupByWorkspace]

### `socket.js`

- `subscribeToBoard(boardId, {onMessage, onResync})` subscribes to
  `/topic/board/{boardId}` and returns an unsubscribe function.
  [socket.js:subscribeToBoard]
- `subscribeToConnection(listener)` reports connection changes and returns an
  unsubscribe function. [socket.js:subscribeToConnection]
- `isSocketConnected()` and `disconnectSocket()`.
  [socket.js:isSocketConnected, disconnectSocket]

### `starredApi.js`

- `STARRED_KEY` is `'kanban_starred'`. `getStarred()`, `toggleStar(boardId)`
  and `filterStarred(boards, starredIds)` read, toggle and filter stars.
  [starredApi.js:STARRED_KEY, getStarred, toggleStar, filterStarred]

### `teamsApi.js`

- `flattenTeams(workspaces)`, `largestTeam(teams)`, `SORTS` (`name`,
  `members`, `workspace`), `sortTeams` and `filterTeams` derive the Teams
  list.
  [teamsApi.js:flattenTeams, largestTeam, SORTS, sortTeams, filterTeams]
- `canManageTeam(role)` is true for `OWNER` or `ADMIN`. `availableMembers(team)`
  and `teamHomes(workspaces)` use it to decide what the UI offers.
  [teamsApi.js:canManageTeam, TEAM_MANAGER_ROLES, availableMembers, teamHomes]
- `addTeamMembers(teamId, userIds)` calls `POST /team/addMember` with
  `{teamId, userId}` once per user and resolves to `{added, failed}`.
  [teamsApi.js:addTeamMembers, addTeamMember]
- `createTeam({name, workspaceId})` calls `POST /team/add` with
  `{teamName, workSpaceId}`. [teamsApi.js:createTeam]
- `teamForBoard(workspace, teamId)` and
  `withTeamMembers(workspace, teamId, people)` resolve a board's team and add
  members to it locally. [teamsApi.js:teamForBoard, withTeamMembers]

## Invariants

- **Backend origin.** REST modules use the hard-coded
  `BASE_URL = 'http://localhost:8080'`. The socket uses
  `WS_URL = 'ws://localhost:8080/ws'` with no SockJS.
  [authApi.js:BASE_URL, boardApi.js:BASE_URL, dashboardApi.js:BASE_URL,
  teamsApi.js:BASE_URL, socket.js:WS_URL]
- **Auth header.** Authenticated requests read `localStorage.jwt_token` and
  send `Authorization: Bearer <token>` only when a token exists.
  [boardApi.js:request, dashboardApi.js:request, teamsApi.js:postJson]
- **Error shape.** A non-OK response in `boardApi`, `dashboardApi` and
  `teamsApi` throws the result of `parseApiError(res)`, so the error carries
  `.status`. Callers branch on it; a 409 from a move is an optimistic-lock
  conflict. `authApi` is the exception: it throws fixed messages
  (`'Invalid email or password.'`, `'Could not create account.'`) and sets no
  status. [boardApi.js:request, apiError.js:parseApiError, authApi.js:login,
  signUp]
- **Client-side validation before a request.** `createBoard` requires a
  non-blank trimmed name, a `workspaceId` and a `teamId`. `createTeam`
  requires a non-blank trimmed name and a `workspaceId`. Each throws before any
  request is made. [boardApi.js:createBoard, teamsApi.js:createTeam]
- **Demo fallback.** `getDashboard()` switches to `demoWorkspaces()` with
  `live: false` on any failure, including a non-array or empty payload. The UI
  must say that it is showing sample data. [dashboardApi.js:getDashboard,
  demoWorkspaces]
- **One normalized shape.** Workspaces go through `normalizeWorkspace` once,
  at the boundary. It accepts `workspaceId` or `workSpaceId`, and teams shaped
  as `{teamName, count}` or `{name, memberCount}`. Any unexpected field becomes
  an empty list or a default rather than an exception.
  [dashboardApi.js:normalizeWorkspace, normalizeTeam, normalizeBoard, toPerson]
- **No second fetch.** The Boards, Teams and board sidebar views get their data
  from `getDashboard()` and `getCachedWorkspaces()`. `boardsApi` and the
  derivation half of `teamsApi` make no requests.
  [boardsApi.js header comment, teamsApi.js header comment,
  dashboardApi.js:getCachedWorkspaces]
- **Immutability.** The derivation and update helpers return new arrays and
  objects and leave their inputs unchanged. `withTeamMembers` returns the same
  workspace object when nothing is new.
  [library.js:sortBy, starredApi.js:toggleStar, boardPrefsApi.js:toggleHidden,
  setDisplay, dashboardApi.js:withBoard, teamsApi.js:withTeamMembers,
  boardStatus.js:filterColumnsByView]
- **Column status comes from the column name.** Before matching, names are
  lower-cased, apostrophes are removed, `-` and `_` become spaces, and spaces
  are collapsed. A name that matches nothing counts as `todo`. A done column
  is one of `done`, `complete`, `completed` or `shipped`.
  [boardStatus.js:normalise, NAMES, columnStatus, boardsApi.js:isDoneColumn]
- **Card keys.** A non-integer (optimistic) card id renders as `PREFIX-…`. An
  unknown view id shows every column.
  [boardStatus.js:cardKey, filterColumnsByView]
- **Progress.** `boardProgress` uses `columns` first, then the demo counters
  `cards`/`done`, and otherwise returns `known: false`. It never produces
  `NaN`. [boardsApi.js:boardProgress, dashboardApi.js:summarise]
- **Team management.** The UI offers team management only to `OWNER` or
  `ADMIN`. `availableMembers` leaves out people with `userId == null`, such as
  the demo snapshot's members. Team ids are compared as strings.
  [teamsApi.js:canManageTeam, availableMembers, teamForBoard]
- **Socket is receive-only.** Writes always go over REST. A subscription is
  re-attached after every reconnect and then calls `onResync`, because the
  simple broker cannot replay missed messages. A malformed frame calls
  `onMessage(null)`. `subscribeToBoard` throws if `boardId` is
  null, undefined or `''`, and returns its unsubscribe function without
  waiting for the connection.
  [socket.js:handleConnect, attach, subscribeToBoard]
- **Storage never breaks the app.** Every localStorage read or write in the
  preference, star and recent modules is wrapped in try/catch and falls back
  to a default. Recents are capped at 8 and deduplicated by `boardId`, newest
  first. [boardPrefsApi.js:read, write, starredApi.js:getStarred, toggleStar,
  dashboardApi.js:rememberVisit, getRecent]

## Side Effects

- **Network (REST)**, all against `http://localhost:8080`:
  - `POST /user/login` and `POST /user/add` [authApi.js:login, signUp]
  - `GET /board/{id}`, `POST /board/create`, `POST /column/create`,
    `DELETE /column/{id}`, `POST /card/create`, `PUT /card/move/{id}` and
    `DELETE /card/{id}` [boardApi.js]
  - `GET /workspace/mine` [dashboardApi.js:getDashboard]
  - `POST /team/addMember`, made one request at a time, and `POST /team/add`
    [teamsApi.js:addTeamMembers, createTeam]
- **Network (WebSocket)**: a singleton STOMP `Client` on
  `ws://localhost:8080/ws`. It reconnects after 5000 ms, sends heartbeats every
  10000 ms in each direction, and subscribes to `/topic/board/{boardId}`. The
  first `subscribeToBoard` call activates it, and `disconnectSocket()` tears it
  down. [socket.js:getClient, RECONNECT_DELAY_MS, HEARTBEAT_MS,
  subscribeToBoard, disconnectSocket]
- **Navigation and URL**: `signInWithGoogle` sets `window.location.href`.
  `consumeOauthCallback` calls `window.history.replaceState({}, '', '/')`.
  [authApi.js:signInWithGoogle, consumeOauthCallback]
- **localStorage keys**:
  - `jwt_token` and `kanban_user`: written by `persistSession`, removed by
    `signOut`, read by every REST module. [authApi.js:persistSession, signOut]
  - `kanban_recent` [dashboardApi.js:RECENT_KEY]
  - `kanban_starred` [starredApi.js:STARRED_KEY]
  - `kanban_hidden_columns`, a map from `boardId` to column ids
    [boardPrefsApi.js:HIDDEN_KEY]
  - `kanban_board_display` [boardPrefsApi.js:DISPLAY_KEY]
- **Module-level mutable state**:
  - `lastWorkspaces` is replaced on every `getDashboard()` and by
    `cacheWorkspace`. [dashboardApi.js:lastWorkspaces]
  - The socket keeps `client`, `hasConnectedBefore`, `lastNotifiedStatus`, and
    the `entries` and `connectionListeners` sets. [socket.js]
- **Console output**:
  - `createCard` logs its payload with `console.log`. [boardApi.js:createCard]
  - `getDashboard` logs the failure status and message when it falls back.
    [dashboardApi.js:getDashboard]
  - The socket logs errors with `console.error`.
    [socket.js:notifyConnection, getClient]

## Verification

- Run from `frontend/`: `npm test -- src/api` for this package, or `npm test`
  for the whole suite. Both use Vitest. Tests live in `./__tests__/`.
