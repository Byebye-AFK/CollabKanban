# Card

## Overview
Cards: the `Card` JPA entity, its repository, and a service and controller
under `/card` for creating, moving, reading and deleting cards. A move
publishes a `CardMovedEvent`. After the transaction commits,
`CardMoveBroadcaster` sends the updated card over STOMP to the board's topic.
This is the live update the frontend's `useBoard` hook subscribes to.

## Interface
- `CardController` (`@RequestMapping("card")`). Every route answers 200 with
  the body; failures come from the service as `ResponseStatusException`s.
  - `POST /card/create`: body `CreateCardReq`, returns `CardResponse`.
  - `PUT /card/move/{cardId}`: body `MoveCardReq`
    (`targetColumnId`, `position`, optional `version`), returns `CardResponse`.
  - `GET /card/{id}`: returns `CardResponse`.
  - `DELETE /card/{id}`: returns the deleted card as `CardResponse`.
- `CardService`: `createCard(CreateCardReq)`, `moveCard(Long, MoveCardReq)`,
  `getCard(Long)`, `deleteCard(Long)`. Constructor-injected with `CardRepo`,
  `ColumRepo`, `UserRepo`, `WorkspaceAccess` and `ApplicationEventPublisher`.
- `CardResponse` (built by the one private `toResponse(Card)` mapper):
  `cardId`, `title`, `description`, `position`, `assignedTo` (user id or
  null), `version`.
- `Card` (`@Entity`, default table name):
  - `cardId`: IDENTITY.
  - `version`: `@Version Long`.
  - `assignedBy`: `@ManyToOne Users`.
  - `assignedTo`: `@ManyToOne Users`.
  - `title`, `description`, `position`.
  - `colum`: `@ManyToOne Colum` on `columnId`.
- `CardRepo`:
  - `lockColumn(Long)`: `@Lock(PESSIMISTIC_WRITE)` on the `Colum` row.
  - `findTop(Colum)`: highest-position card in the column (no lock), or null.
  - `findByCardId(Long)`.
- `CardMovedEvent(Long boardId, CardResponse res)`: a record, used as an
  application event.
- `CardMoveBroadcaster.broadCastEvent`:
  `@TransactionalEventListener(phase = AFTER_COMMIT)`.

## Invariants
- Permissions go through `WorkspaceAccess`, so they work the same on boards
  with and without a team:
  - create, move and delete need `requireBoardEditor` on the card's board;
  - read needs `requireBoardReader`.
- Errors: 400 bad input, 401/403 from `WorkspaceAccess`, 404 "Card not found"
  / "Column not found" / "Assigned user not found", 409 stale version. Never 501.
- `createCard` (`@Transactional`):
  - 400 if the title is blank or `columnId` is missing.
  - Locks the column row with `lockColumn` (404 if missing) before computing
    the position, so concurrent creates in the same column, including the
    first card of an empty column, are serialised.
  - Position is `req.position` when sent; otherwise 1000 for an empty column,
    or the current highest position + 1000.
  - `assignedTo` is optional (404 if it names an unknown user). `assignedBy`
    is never set.
- `moveCard` (`@Transactional`):
  - 400 if `targetColumnId` or `position` is missing; 404 for a missing card,
    checked before the card is used.
  - If `req.version` is sent and differs from the card's `@Version`, it throws
    409 "Someone else changed this card first. Reload and try again." A 409 can
    also come from `OptimisticLockingFailureException` when another move
    commits between this transaction's load and flush
    (see [`../Errors/README.md`](../Errors/README.md)).
  - The target column must exist (404) and be on the card's board, otherwise
    400 "Cards can only move within their board".
  - Saves with `saveAndFlush`, so the returned and broadcast `CardResponse`
    carries the incremented `version`. Positions are taken from the request;
    nothing reorders other cards.
- `getCard` is `@Transactional(readOnly = true)` and handles unassigned cards
  (`assignedTo: null`).
- `deleteCard` (`@Transactional`) returns the card as it was before deletion.
- The broadcast happens only after a successful commit, so a rolled-back move
  is never sent.

## Side Effects
- `createCard` inserts a row, `moveCard` updates one, and `deleteCard` deletes
  one.
- `moveCard` publishes `CardMovedEvent(boardId, res)` with the complete
  response.
- `CardMoveBroadcaster` calls
  `SimpMessagingTemplate.convertAndSend("/topic/board/" + boardId, CardResponse)`.

## Verification
- Unit tests: `src/test/java/com/collabKanban/Kanban/Card/CardServiceTest.java`
  (Mockito, no Spring context or database).
- Run: `mvn test` (from the repository root)
