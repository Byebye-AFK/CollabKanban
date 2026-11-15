# EGM Drift Report: 2026-11-15

Scope: the 14 EGM README contracts written by `egm-bootstrap` under
`frontend/`, each checked against the current source in its directory. Only
divergences are listed. Paths are relative to the README's directory unless
stated. **[Doc]** means the README says something the code does not do.
**[Gap]** means the code does something the README leaves out. **[Code]**
means a problem in the code itself that the check turned up, for human
triage.

## README.md (frontend root)

- [Code] `vite.config.js` proxies `/board`, `/boards` and `/cards` to `:8080`.
  No api module uses the proxy, because they all call the absolute
  `http://localhost:8080`, and `/boards` and `/cards` match no backend route.
  The comment at `src/api/boardApi.js:5` repeats the same outdated proxy
  claim.

## loadtest/README.md

- No drift detected. Some small helpers are not listed (`tally`, `fmt`,
  `readBoard`, `newCard`, `printReport` in `race.mjs`).

## src/README.md

- No drift detected.

## src/api/README.md

- [Doc] `parseApiError` fallback order: the raw text is used only when the
  body is not valid JSON. A JSON body without `message` or `error` (for
  example `{}`) goes straight to `Request failed with status N`.
  `apiError.js:20-29`
- [Doc] "`availableMembers(team)` and `teamHomes(workspaces)` use
  [`canManageTeam`]": only `teamHomes` does (`teamsApi.js:183`).
  `availableMembers` checks only `userId != null` and that the person is not
  already on the team (`teamsApi.js:87-92`).
- [Doc] `TEAM_MANAGER_ROLES` is cited under Interface, but it is a private
  constant and is not exported. `teamsApi.js:19`
- [Doc] The Overview says the REST clients turn failures into Errors "through
  `apiError`". `authApi` never imports it and throws fixed messages instead.
  The README's own Invariants section says so, so the README contradicts
  itself. `authApi.js:58,69`
- [Doc] "`jwt_token` … read by every REST module": `authApi` only writes and
  removes it. The modules that read it are `boardApi`, `dashboardApi` and
  `teamsApi`.
- [Doc] "Storage never breaks the app": `getRecent` does not check that it
  got an array. A stored `null` or object reaches `flattenBoards`
  (`recent.map`) and `summarise` (`recent[0]`). `getStarred` does check.
  `dashboardApi.js:39-45`, `boardsApi.js:77`
- [Doc] "Any unexpected field becomes an empty list or a default": only
  `null` and `undefined` are guarded (`|| []`). A truthy non-array
  `members`, `teams` or `boards` throws on `.map`, and `normalizeBoard`
  gives `boardId` no default. `dashboardApi.js:178,189,204-207`
- [Doc] The immutability claim does not hold for `filterBy`. It returns the
  same `items` array when the query is blank, and `query.trim()` throws on
  `null`. `library.js:9-10`
- [Doc] Edge case: "`boardProgress` never produces `NaN`". A numeric `NaN`
  in `board.cards` passes the `typeof` check. `boardsApi.js:50-53`
- [Gap] These shapes are not documented:
  - the `getDashboard().stats` shape `{teamCount, boardCount, openCards, lastWorkspace, lastVisitedBoard}`
  - `groupByWorkspace` → `[{workspaceId, name, items}]`
  - `addTeamMembers` failure entries `{userId, message}`
- [Gap] The normalizer defaults and fallbacks are not documented:
  - `workspaceId` falls back to the array index.
  - Names default to `'Untitled workspace'`, `'Untitled team'` and `'Untitled board'`, and `role` defaults to `'MEMBER'`.
  - Team ids are synthesized as `t{index}-{name}` when missing.
  - `id` is accepted as `boardId`.

  `dashboardApi.js:155-209`
- [Gap] `cacheWorkspace` only replaces a workspace that is already cached.
  A workspace it doesn't find is silently dropped. `dashboardApi.js:238-242`
- [Gap] `login` decodes the email from the JWT's `sub`, then `email`, and
  the name from the email's local part, falling back to `'there'`.
  `authApi.js:4-19`
- [Gap] Socket behaviours not described:
  - Every `subscribeToBoard` call while disconnected calls `activate()`.
  - `disconnectSocket` does not clear `entries`, so old subscriptions re-attach later.
  - `subscribeToConnection` does not report the current status.
  - A WebSocket error counts as a disconnect.

  `socket.js:24-35,85-88,123-161`
- [Gap] View mapping is not described: `active` shows `todo` and `started`,
  and `backlog` shows `backlog`. `boardStatus.js:17-23,80-83`
- [Gap] Sort defaults (`'name'`), the `sortBy` fallback, and `recent`
  putting never-opened boards last are not described. `getDisplay` resets
  non-boolean values but `setDisplay` does not validate.
- [Code] `teamsApi.postJson` always calls `res.json()`. A successful add with
  an empty or 204 body would be reported as failed. `teamsApi.js:105,123-127`
- [Code] In `boardApi.request`, `...options` is spread after `headers`, so a
  caller passing its own `options.headers` would drop Authorization. No
  caller does this today. `boardApi.js:12-19`
- [Code] Outdated JSDoc routes (`POST /boards/{id}/columns`, `PATCH
  /cards/{id}/move`, `DELETE /cards/{id}`, `POST /cards`) do not match the
  code, and `createCard` leaves a `console.log` in place.
  `boardApi.js:87`, `createCard`

## src/hooks/README.md

- [Doc] Move positions use falsy fallbacks:
  `(first.position || 1000) - 1000` and `(last.position || 0) + 1000`. A
  head card at position 0 yields 0, not −1000. `useBoard.js:201-207`
- [Doc] A new column gets `max + 1000` only when some position is positive.
  The `reduce` starts at 0, so if all positions are negative the result is
  1000. `useBoard.js:91`
- [Doc] "REST, socket, and derivation logic lives in `../api/`":
  `useDecryptTree` imports `scrambleFrame` and `prefersReducedMotion` from
  `../components/ui/EncryptedText`. `useDecryptTree.js:2`
- [Doc] "A successful move does not refetch" is true locally, but the
  server's broadcast echoes back to this client and triggers `loadBoard`
  anyway. `useBoard.js:74,278-281`
- [Gap] `useBoard` does not unsubscribe the board socket on unmount. Callers
  must call `disconnectBoardSocket()` themselves (`BoardPage` does).
  `disconnectBoardSocket` also resets the stored id. `useBoard.js:36,63-85`
- [Gap] `loadBoard` never rejects. `error` holds a string (`err.message`),
  not an Error, and `isLive` starts as `false`. `useBoard.js:23-58`
- [Gap] The 409 resync `loadBoard(board.boardId)` is not awaited and uses
  the `board` closure. `sourceColumnId` and `targetIndex` are never sent to
  the server. `useBoard.js:282-296`
- [Gap] The write helpers assume a loaded board: they read `board.columns`
  without a null guard. `useBoard.js:140,181`
- [Gap] `useBoardTeam` also uses `teamForBoard` and `withTeamMembers`, which
  make retries idempotent. `addMembers` throws when `team` is `null`.
  `useBoardTeam.js:26-35`
- [Gap] Listener and identity notes:
  - `useDismiss` dismisses on any press when `ref.current` is null.
  - `useScrollSpy` starts at `sections[0]?.id` and re-subscribes when the `sections` identity changes, so callers should memoize it.
  - `useRailNavigate`'s `navigate` is not memoized.
- [Code] `deleteColumn` leaves a `console.log('Delete Column hook called', …)` in place.

## src/pages/README.md

- [Doc] "`onGreeted()` fires once on mount": it fires only when
  `shouldAnimateGreeting` is true. `DashboardPage.jsx:63`
- [Doc] "the arranging … is delegated to pure functions there": the
  dashboard workspace filter is an inline `useMemo`, and `countMatches` is
  local to the page. `DashboardPage.jsx:168-176`, `BoardPage.jsx:29-38`
- [Doc] TeamsPage reloads after an add only when `result.added.length > 0`.
  Create errors propagate to `CreateTeamModal` (there is no try/catch).
  `TeamsPage.jsx:79-93`
- [Doc] `is-paused` is applied to `.lp-stage` (`previewRef`), not to
  `.lp-preview`. `LandingPage.jsx:205-208,258`
- [Doc] The "Empty vs. no-match" invariant cites `emptyMessage`, but
  TeamsPage has no such prop. Its empty text depends on `homes.length`.
  `TeamsPage.jsx:168-174`
- [Gap] `BoardLibraryPage`, `TeamsPage` and `BoardPage` route sidebar clicks
  through `useRailNavigate`. BoardPage passes `null` as `self`.
  `BoardLibraryPage.jsx:79`, `TeamsPage.jsx:106`, `BoardPage.jsx:100`
- [Gap] Load-failure states ("Couldn't load your boards / teams /
  dashboard.") and the dashboard's clipboard-failure and "Workspace creation
  lands with POST /workspace/create" toasts are not documented.
- [Gap] BoardPage calls `loadBoard` from Refresh and "Try again". It skips
  the lifecycle effect when `boardId` is falsy. `BoardMembers` and the
  Add-people modal need a `team`. `backLabel` is only a tooltip. Display
  options are global, while hidden columns are per board.
  `BoardPage.jsx:75-79,114-188,218-231`
- [Gap] `initialSection` maps only `graph` and `workspaces`, and anything
  else scrolls to the top. "Runs once" relies on App clearing the prop.
  `DashboardPage.jsx:148-151`
- [Code] The dashboard modal calls `openWs.role.toLowerCase()` without a
  guard. `DashboardPage.jsx:281`

## src/components/README.md

- [Gap] `LoginModal` submits on Enter anywhere in the card, including on the
  Google button. Its backdrop closes on `onClick`, while `ui/Modal` uses
  `mousedown`. `LoginModal.jsx:40-44`
- [Gap] `TaskCard` highlights query matches with `<mark class="brd-mark-hit">`,
  and it has a third `setTimeout(…, 0)` for `is-dragging`. The `LANDED_MS`
  and `CONFIRM_MS` timers are not cleared on unmount.
  `TaskCard.jsx:12-37,72,89`, `KanbanBoard.jsx:52`
- [Gap] `HiddenColumns` also receives the wrapped `handleMoveCard`.
  `KanbanBoard.jsx:112`
- [Gap] The input `maxLength`s are not documented: card title 200,
  description 2000, column name 80. Neither are the column header's
  `visible/total` count during a search or the stagger
  (`STAGGER_MS = 40`, `MAX_STAGGER_STEPS = 8`).

## src/components/board/README.md

- [Gap] `HiddenColumns` starts expanded. `BoardMembers` shows "No members
  yet." and uses `AVATAR_SIZE = 22`.
- [Gap] `CreateBoardModal`:
  - With no teams it shows a "has no teams yet" hint and can never submit.
  - After a partial failure, Cancel becomes "Close".
  - "Open board" calls `result.open()` and then `onClose()`.
  - It depends on `teams/PeoplePicker`.

  `CreateBoardModal.jsx:3,95-132`

## src/components/boards/README.md

- [Gap] When progress is known, the label is "No cards yet" if `total === 0`
  and "`done`/`total` done" otherwise. The meta line appends
  `relativeTime(lastVisitedAt)`. `members` is a list of name strings.
  `BoardCard.jsx:36-82`
- [Gap] `ProgressRing` clamps only the arc. The text and aria-label show the
  raw `percent`. `ProgressRing.jsx:20,35`

## src/components/dashboard/README.md

- [Gap] Callback arguments are not documented: `onOpenBoard(lastVisitedBoard.boardId)`
  and `onOpenWorkspace(workspace)`. `members` is a list of name strings, and
  `role` must be a string. `StatCards.jsx:72-81`, `WorkspaceList.jsx:112-116`
- [Gap] `GraphView`:
  - It has a hover tooltip, hover-only team labels and draggable nodes.
  - It runs 400 seeded physics iterations before the first paint.
  - It sets `canvas.style.cursor`.
  - Its whole effect rebuilds whenever the `onSelectWorkspace` identity changes.

  `GraphView.jsx:204,276-408`
- [Code] `WorkspaceList` rows open only on mouse click; there is no keyboard
  handler on `<tr onClick>`. `WorkspaceList.jsx:94`

## src/components/library/README.md

- [Gap] In grouped view each item needs `workspaceId` and `workspaceName`.
  Presses inside the toolbar's right-hand group don't close the sort menu,
  and the toolbar uses its own listener effect, not `useDismiss`.
  `LibraryToolbar.jsx:33-61`
- [Code] The filtered count always adds an "s" to `noun`, even when the
  total is 1. `LibraryToolbar.jsx:57`

## src/components/shell/README.md

- [Doc] "`GLYPHS` (path data keyed by nav id plus `signout`)": it also has
  `settings`, which belongs to the separate `SETTINGS` item, not `NAV`.
  `icons.jsx:39`, `Sidebar.jsx:29`
- [Gap] `PageHeader` renders the toggle only when `onToggleCollapse` is
  passed. A last crumb with `onClick` is not clickable. The footer falls
  back to "Guest" / "not signed in" and has a Sign out button. A workspace
  with no boards shows "No boards yet", and the tree expansion is seeded
  only once. `PageHeader.jsx:11-34`, `Sidebar.jsx:48-208`
- [Gap] `handleCreate` also uses `withBoard` and `withTeamMembers`. It
  updates only the module cache, not the `workspaces` prop, and
  `createBoard` rejections reach `CreateBoardModal`. `Sidebar.jsx:83-84`
- [Gap] `StatusIcon` spreads `...rest`, and the done and canceled glyphs
  hard-code a `#fff` stroke. `icons.jsx:191-212`

## src/components/teams/README.md

- [Gap] `AddTeamMembersModal`:
  - It needs `team.{name, workspaceName, members, workspacePeople}`.
  - Search uses `ui/GooeyInput`.
  - It has an "Everyone … is already on …" empty state.

  `AddTeamMembersModal.jsx:32,66-97`
- [Gap] `TeamCard` calls `onAddMembers(team)`, requires a string `role`, and
  shows "No members yet" at 0 members. `CreateTeamModal` with no workspaces
  renders an empty select that can't be submitted.
- [Code] Pressing Escape in the search box clears the query and also closes
  the dialog, because neither `GooeyInput` nor `Modal` stops propagation.
  `GooeyInput.jsx:60-63`, `Modal.jsx:24`
- [Code] If `largest` is 0, the `TeamCard` meter width becomes `NaN%`.
  `TeamCard.jsx:24`

## src/components/ui/README.md

- [Gap] Defaults are not documented:
  - `GooeyInput`: `placeholder='Search…'`, `label='Search'`, `type='text'`, `hotkey=false`, and a fixed `name="search"`. It also has a Clear button, a `⌘K` hint, and a trigger with `tabIndex=-1`.
  - `EncryptedText`: `revealDelayMs`/`flipDelayMs` = 50, `DEFAULT_CHARSET`, an interval of `min(flip, reveal)`, and the class `enc-glyph`.
- [Gap] `prefersReducedMotion()` is checked on each render, not subscribed
  to. `Modal` has no focus trap or focus restore, its close button is
  `type="button"`, and `aria-label` defaults to `title`.
- [Code] The same Escape propagation issue as in teams: Escape in a
  `GooeyInput` inside a `Modal` also closes the dialog.
