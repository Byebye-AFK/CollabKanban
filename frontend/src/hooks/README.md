# hooks

## Overview

Custom React hooks shared by the CollabKanban frontend pages and components.
`useBoard` holds the state of one open board: it loads the board over REST,
applies optimistic writes, and refetches when the STOMP socket reports a
change. `useBoardTeam` works out a board's team from data the workspace
payload already holds. The other hooks handle UI behavior: dismissing
popovers, rail navigation for the library pages, scroll-spy for dashboard
sections, and a text "decrypt" animation.

The hooks stay thin. REST, socket, and derivation logic lives in
[`../api/`](../api/README.md), and each hook calls into it.

## Interface

- `useBoard()` [useBoard.js:useBoard] takes no arguments. It returns
  `{ board, loading, error, isLive, loadBoard, connectBoardSocket, disconnectBoardSocket, addColumn, addCard, moveCard, deleteCard, deleteColumn }`.
  - `loadBoard(boardId)` [useBoard.js:loadBoard] fetches the board and stores
    it with columns and cards sorted by `position`.
  - `connectBoardSocket(boardId)` / `disconnectBoardSocket()`
    [useBoard.js:connectBoardSocket, disconnectBoardSocket] subscribe to and
    unsubscribe from the live updates for one board.
  - `addColumn(boardId, name)` [useBoard.js:addColumn],
    `addCard(payload)` [useBoard.js:addCard] (payload has `columnId`, `title`,
    and optionally `description` and `assignedToUserId`),
    `moveCard(cardId, sourceColumnId, targetColumnId, targetIndex)`
    [useBoard.js:moveCard], `deleteCard(cardId, columnId)`
    [useBoard.js:deleteCard], and `deleteColumn(columnId)`
    [useBoard.js:deleteColumn] all return Promises that reject with the API
    error after the optimistic change has been rolled back.
- `useBoardTeam(workspace, teamId)` [useBoardTeam.js:useBoardTeam] returns
  `{ team, canManage, addMembers }`. `addMembers(userIds)` resolves to
  `{ added: number[], failed: { userId, message }[] }`, the shape that
  [api/teamsApi.js:addTeamMembers] returns.
- `useDecryptTree(ref, isActive)` [useDecryptTree.js:useDecryptTree] returns
  nothing. It animates every text node under `ref.current`.
- `revealedCountAt(elapsedMs, length)` [useDecryptTree.js:revealedCountAt] is
  a pure helper. It returns how many characters have been revealed after
  `elapsedMs`. The time per character is
  `min(REVEAL_STEP_MS = 30, MAX_REVEAL_MS = 1200 / length)`.
- `useDismiss(ref, isOpen, onDismiss)` [useDismiss.js:useDismiss] returns
  nothing. It calls `onDismiss` on Escape or on a pointer press outside `ref`.
- `useRailNavigate(self, onNavigate)` [useRailNavigate.js:useRailNavigate]
  returns `{ navigate, toast }`. It is used by the library pages (Boards and
  Teams).
- `useScrollSpy(containerRef, sections, enabled = true)`
  [useScrollSpy.js:useScrollSpy] returns the active section id, or `null`.
  This is the module's only **default** export. All the other hooks are named
  exports.

## Invariants

- **Immutable board updates.** Every `setBoard` call in `useBoard` builds new
  `board`, `columns`, and `cards` objects or arrays. It never edits the
  current state. [useBoard.js:addColumn, addCard, moveCard, deleteCard, deleteColumn]
- **Optimistic placeholders are marked.** Placeholder columns and cards carry
  `_isOptimistic: true` and temporary ids (`temp-col-<ts>`, `temp-card-<ts>`).
  When the server replies, the placeholder is replaced by the created entity.
  When the request fails, the placeholder is removed.
  [useBoard.js:addColumn, addCard]
- **Rollback on failure.** `moveCard`, `deleteCard`, and `deleteColumn` save
  the current `board` before the optimistic change. If the request fails,
  they restore that snapshot and rethrow the error.
  [useBoard.js:moveCard, deleteCard, deleteColumn]
- **409 on move means a conflict.** If `moveCard` gets `err.status === 409`
  (optimistic-lock conflict), it also calls `loadBoard(board.boardId)`,
  because the saved snapshot is stale too. It still rethrows the error.
  [useBoard.js:moveCard]
- **Move positions are spaced 1000 apart.** A card moved into an empty column
  gets `1000`. At index 0 it gets the first card's position minus `1000`. At
  the end it gets the last card's position plus `1000`. Between two cards it
  gets `Math.floor` of the midpoint. New columns get the highest column
  position plus `1000`. [useBoard.js:moveCard, addColumn]
- **The socket only receives.** Writes always go over REST. A broadcast, or a
  resync after a reconnect, triggers a full `loadBoard` rather than merging
  the change into local state. A successful move does not refetch.
  [useBoard.js:connectBoardSocket, moveCard]
- **Calling `connectBoardSocket` twice is safe.** If `boardId` is falsy or
  equals the board already subscribed, the call does nothing. Switching to a
  different board unsubscribes from the old one first.
  [useBoard.js:connectBoardSocket]
- **Team additions reset with the workspace.** Members added locally are
  stored against the `workspace` object they were made on. When a different
  `workspace` reference is passed in, they are dropped without running an
  effect. [useBoardTeam.js:useBoardTeam]
- **Who can manage a team.** `canManage` is true only if a team was resolved
  and `canManageTeam(workspace.role)` returns true.
  [useBoardTeam.js:useBoardTeam, api/teamsApi.js:canManageTeam]
- **Only confirmed members are added.** `addMembers` adds to local state only
  the people whose ids appear in `result.added`, taken from
  `team.workspacePeople`. [useBoardTeam.js:addMembers]
- **When the decrypt animation runs.** `useDecryptTree` does nothing when
  `isActive` is false, when `ref.current` is missing, when
  `prefersReducedMotion()` returns true, or when the subtree has no non-blank
  text. Elements matching `[data-no-decrypt]`, and everything inside them,
  are skipped. [useDecryptTree.js:useDecryptTree, collectEntries, SKIP_SELECTOR]
- **React keeps ownership of text nodes.** The animation stops tracking a
  text node if React has disconnected or rewritten it. On cleanup it restores
  the original text of any node that is still scrambled.
  [useDecryptTree.js:useDecryptTree]
- **Listeners only while open.** `useDismiss` attaches its listeners only
  while `isOpen` is true. [useDismiss.js:useDismiss]
- **Rail routing.** In `useRailNavigate`, navigating to `self` does nothing.
  Ids in `ROUTABLE` (`dashboard`, `boards`, `starred`, `teams`, `graph`,
  `workspaces`) are forwarded to `onNavigate`. Any other id sets a
  "`<Id>` is coming next" toast. [useRailNavigate.js:ROUTABLE, navigate]
- **Scroll-spy measures against the container.** Sections are measured from
  the container's top plus `READING_LINE_OFFSET = 110` px, not from the
  viewport. When the container is within `BOTTOM_EPSILON = 4` px of the end,
  the last section becomes active. `sections` must be listed in document
  order. [useScrollSpy.js:useScrollSpy]

## Side Effects

- **Network (REST).** All calls go through [api/boardApi.js](../api/boardApi.js):
  - `getBoard` calls `GET /board/{id}`.
  - `createColumn` calls `POST /column/create`.
  - `deleteColumn` calls `DELETE /column/{id}`.
  - `createCard` calls `POST /card/create`.
  - `moveCard` calls `PUT /card/move/{id}`. It sends the version of the card
    it last saw and stores the version from the response on the card.
  - `deleteCard` calls `DELETE /card/{id}`.

  [useBoard.js:useBoard]
- **Network (REST).** `addMembers` calls `addTeamMembers`, which sends one
  `POST /team/addMember` per user id.
  [useBoardTeam.js:addMembers, api/teamsApi.js:addTeamMembers]
- **WebSocket subscriptions.** `subscribeToConnection(setIsLive)` runs on
  mount and its unsubscribe runs on unmount.
  `subscribeToBoard(boardId, { onMessage, onResync })` subscribes to
  `/topic/board/{boardId}` on the shared STOMP client.
  [useBoard.js:useBoard, connectBoardSocket, api/socket.js:subscribeToBoard, subscribeToConnection]
- **Console output.** `deleteColumn` calls
  `console.log("Delete Column hook called", columnId)` every time it runs.
  [useBoard.js:deleteColumn]
- **DOM changes.** `useDecryptTree` writes `nodeValue` directly on text nodes.
  While the animation runs it sets `aria-busy="true"` on the root and removes
  it when done. It uses `setInterval` with `TICK_MS = 40`.
  [useDecryptTree.js:useDecryptTree]
- **Global listeners.** `useDismiss` adds `pointerdown` and `keydown`
  listeners on `document` and removes them on cleanup.
  [useDismiss.js:useDismiss]
- **Global listeners.** `useScrollSpy` adds a passive `scroll` listener on the
  container and a `resize` listener on `window`. Measurements are batched
  through `requestAnimationFrame`, and any pending frame is cancelled on
  cleanup. [useScrollSpy.js:useScrollSpy]
- **Timers.** `useRailNavigate` clears its toast after `TOAST_MS = 2200` ms
  using `setTimeout`, and clears the timer on cleanup.
  [useRailNavigate.js:useRailNavigate]

## Verification

- Run from `frontend/`: `npm test -- src/hooks`
- Tests live in `__tests__/`: `useBoard.test.jsx`, `useBoardTeam.test.jsx`,
  and `useDecryptTree.test.jsx`. `useDismiss`, `useRailNavigate`, and
  `useScrollSpy` have no tests in this directory.
