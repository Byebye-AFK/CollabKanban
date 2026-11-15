# components

## Overview
React components for the CollabKanban frontend. Direct files are the Kanban stage (`KanbanBoard` → `KanbanColumn` → `TaskCard`), its create dialogs, the shared `Avatar`, and the signed-out `LoginModal`. Subdirectories group the app shell, shared UI primitives, board add-ons, library lists, dashboard sections and team dialogs. Components stay thin: data and writes arrive as props/callbacks (board state lives in `src/hooks/useBoard.js`), with `LoginModal` and `shell/Sidebar` the only components that call `src/api/*` network functions directly.

## Interface
- `Avatar` (default) `{ name, size = 20, decorative = false }` — initials disc coloured by `colorFor(name)`; returns `null` without a name [Avatar.jsx:Avatar]
- `KanbanBoard` (default) `{ board, columns, hiddenColumns, query, showDescriptions, createColumnOpen, onCreateColumnOpen, onAddColumn, onAddCard, onDeleteCard, onDeleteColumn, onHideColumn, onShowColumn, onMoveCard }` [KanbanBoard.jsx:KanbanBoard]
- `KanbanColumn` (default) `{ column, columnIndex, boardName, query, drag, landedCardId, showDescription, onAddCard, onDeleteCard, onDeleteColumn, onHideColumn, onMoveCard, onDragStart, onDragEnd }` — includes internal `ColumnMenu` (Hide / Delete) [KanbanColumn.jsx:KanbanColumn, ColumnMenu]
- `TaskCard` (default) `{ card, columnId, status, cardKey, query, landed, showDescription, onDelete, onDragStart, onDragEnd }` [TaskCard.jsx:TaskCard]
- `CreateCardModal` (default) `{ columnId, columnName, status, onSubmit, onClose }` — `onSubmit({ title, description, columnId, assignedTo? })` [CreateCardModal.jsx:CreateCardModal]
- `CreateColumnModal` (default) `{ onSubmit, onClose }` — `onSubmit(name)`; offers `SUGGESTIONS` (Backlog, Todo, In Progress, In Review, Done, Canceled) [CreateColumnModal.jsx:CreateColumnModal, SUGGESTIONS]
- `LoginModal` (default) `{ onClose, onLogin }` — login / signup modes plus Google sign-in; `onLogin(user)` on success [LoginModal.jsx:LoginModal]
- Subdirectories:
  - [board](./board/README.md) — members popover, Display menu, Hidden columns panel, Create board dialog
  - [boards](./boards/README.md) — Boards library row and progress ring
  - [dashboard](./dashboard/README.md) — stat row, force-directed graph, workspace table
  - [library](./library/README.md) — grouped/flat grid, skeleton, toolbar shared by Boards and Teams
  - [shell](./shell/README.md) — `AppShell`, `Sidebar`, `PageHeader`, icons, palette
  - [teams](./teams/README.md) — team row, create/add-members dialogs, `PeoplePicker`
  - [ui](./ui/README.md) — `Modal`, `GooeyInput`, `EncryptedText`

## Invariants
- Drag payload is JSON in `dataTransfer` `text/plain`: `{ cardId, sourceColumnId, cardPosition }`; drop targets ignore payloads without `cardId` or that fail to parse [TaskCard.jsx:handleDragStart, KanbanColumn.jsx:handleDrop]
- Drop targets are the gaps between cards; the top/bottom half of a card targets the gap above/below. Slots adjacent to the dragged card are no-ops, and same-column moves shift the target index down by one when moving below the source [KanbanColumn.jsx:isNoop, allowDropOnCard, handleDrop]
- Search filtering is display-only: slot indices stay anchored to the full `column.cards` list so moves made while searching land correctly [KanbanColumn.jsx:visible]
- `onMoveCard(cardId, sourceColumnId, targetColumnId, targetIndex)` is wrapped by `KanbanBoard` to flag the "just landed" card for `LANDED_MS = 700`; the flag clears early if the move rejects [KanbanBoard.jsx:handleMoveCard]
- `KanbanBoard` shows an empty-board state (with "Create first column") when `board.columns` is empty, and a "No columns in this view" state when the filtered `columns` prop is empty [KanbanBoard.jsx:KanbanBoard]
- Card delete is two-step: first click arms for `CONFIRM_MS = 2400`, second click calls `onDelete(cardId, columnId)`; leaving the card disarms [TaskCard.jsx:handleDeleteClick]
- Column delete requires `window.confirm` [KanbanColumn.jsx:ColumnMenu]
- Optimistic cards (`card._isOptimistic`) render with `is-pending` [TaskCard.jsx:className]
- Create dialogs require a trimmed non-empty title/name, stay open and show `err.message` on rejection; `CreateCardModal` submits on ⌘/Ctrl-Enter and sends `assignedTo` as a `Number` only when filled; `CreateColumnModal` submits on Enter [CreateCardModal.jsx:handleSubmit, handleKeyDown, CreateColumnModal.jsx:handleSubmit]
- `LoginModal` requires email + password (and name in signup); closes on Escape or backdrop click [LoginModal.jsx:valid, LoginModal]

## Side Effects
- `LoginModal` calls `login` (`POST /user/login`), `signUp` (`POST /user/add` then login) and `signInWithGoogle` (sets `window.location.href` to `/oauth2/authorization/google`) from `src/api/authApi.js`; successful login persists `jwt_token` / `kanban_user` in `localStorage` there [LoginModal.jsx:handleSubmit]
- `LoginModal` adds a `window` `keydown` listener; `ColumnMenu` uses `useDismiss` (`document` listeners while open) [LoginModal.jsx, KanbanColumn.jsx:ColumnMenu]
- `KanbanBoard` and `TaskCard` use `setTimeout` timers for landed / confirm states [KanbanBoard.jsx, TaskCard.jsx]
- `LoginModal` imports `./LoginModal.css`.
- Board/column/card writes are not made here; they go through the callbacks (wired to `useBoard` and `src/api/boardApi.js`).

## Verification
- Run: `npm test -- src/components` (from `frontend/`); the direct files here have no tests yet, so full-suite `npm test` is the broader check
