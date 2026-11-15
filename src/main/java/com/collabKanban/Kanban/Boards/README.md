# Boards

## Overview
Boards and their columns, spelled `Colum` throughout. The package has the JPA
entities, repositories, and services and controllers for creating and reading
boards, and for creating, reading and deleting columns. A board belongs to a
workspace and, optionally, a team. Columns belong to a board and cards to a
column. Both of those links cascade fully, with orphan removal.

## Interface
- `BoardController` (`@RequestMapping("board")`):
  - `POST /board/create`: body `CreateBoardReq`, returns `BoardResponse`
    (with an empty `columns` list).
  - `GET /board/{id}`: returns `BoardResponse`, with nested columns and cards.
- `ColumController` (`@RequestMapping("column")`):
  - `POST /column/create`: body `CreateColumReq`, returns `ColumResponse`.
  - `GET /column/{id}`: returns `ColumResponse` with its cards.
  - `DELETE /column/{id}`: returns the deleted column's id, name and position.
- `BoardService`:
  - `createBoard(CreateBoardReq)` (`@Transactional`).
  - `findBoards(Long boardId)` (`@Transactional(readOnly = true)`): load or
    404, `requireBoardReader`, then `toResponse`.
  - `toResponse(Board)`: maps an already-loaded board. No access check and no
    query, for callers (such as the workspace listing) that already checked
    access.
- `ColumService`: `createColum(CreateColumReq)`, `deleteColum(Long)`
  (`@Transactional`), `getColum(Long)` (`@Transactional(readOnly = true)`).
- `BoardMapper` (package-private): the single entity-to-response mapping for
  boards, columns and cards, shared by both services.
- `Board` (`@Entity`):
  - `boardId`: IDENTITY.
  - `workspace`: `@ManyToOne` on `workspaceId`, not null.
  - `name`: not null.
  - `position`.
  - `columns`: `@OneToMany(mappedBy="board", cascade=ALL, orphanRemoval=true)`.
  - `team`: `@ManyToOne` on `teamId`, nullable.
- `Colum` (`@Entity`):
  - `columnId`: IDENTITY.
  - `name`: not null.
  - `position`.
  - `board`: `@ManyToOne` on `boardId`, not null.
  - `cards`: `@OneToMany(mappedBy="colum", cascade=ALL, orphanRemoval=true)`.
- `BoardRepo`: plain `JpaRepository<Board, Long>`.
- `ColumRepo`:
  - `findByboard(Board)`.
  - `findTop(Board)`: highest non-null position, `ORDER BY c.position DESC
    LIMIT 1`.

## Invariants
- Access, all via `WorkSpace/WorkspaceAccess` using the signed-in caller:
  - `createBoard`: the workspace must exist (404) and the caller must be an
    OWNER, ADMIN or MEMBER (403 otherwise). A given `teamId` must exist (404)
    and belong to the same workspace (400 "That team belongs to another
    workspace").
  - `GET /board/{id}` and `GET /column/{id}`: any workspace member
    (`requireBoardReader`).
  - Column create and delete: `requireBoardEditor` (on a team board a MEMBER
    must also be on the team).
- Every lookup uses `findById` and fails with a 404 `ResponseStatusException`
  ("Board not found", "Column not found", "Workspace not found", "Team not
  found"). Controllers return 200 with the body; every failure comes from a
  `ResponseStatusException` in the services.
- Validation: board and column names must be non-blank (400) and are stored
  trimmed. `workspaceId` and `boardId` are required (400).
- Ordering: columns and cards are always returned sorted by `position`, nulls
  last, then by id. `BoardResponse.position` and `ColumResponse.position` are
  filled.
- Card mapping includes `assignedTo` (null for an unassigned card) and
  `version` (the card's `@Version`, echoed by the client on move).
- Positions:
  - A new column uses the client's `position` when it is sent. Otherwise it
    gets the board's highest position + 1000, or 1000 for an empty board.
  - A board's position is copied from the request.
- `createColum` returns the saved entity, so `columnId` is set.
- The team is optional, and `teamId` is null in the response for a board with
  no team.
- `Board` and `Colum` have no `@Version`, so they have no optimistic locking.

## Side Effects
- `createBoard` inserts a `Board` row and `createColum` inserts a `Colum` row.
- `deleteColum` deletes the column, and cascade plus orphan removal delete its
  cards.
- Removing a `Board` cascades to its columns and from them to their cards.
- This package publishes no events and sends no WebSocket broadcasts.

## Verification
- Unit tests (Mockito, no Spring context): `src/test/java/com/collabKanban/Kanban/Boards/`.
- Run: `mvn test` (from the repository root)
