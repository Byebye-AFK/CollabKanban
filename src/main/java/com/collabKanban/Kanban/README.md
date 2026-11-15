# Kanban (`com.collabKanban.Kanban`)

## Overview
Root package of the CollabKanban Spring Boot backend. It holds only the
application entry point. Every feature lives in a sub-package, organized by
domain: users, workspaces, teams, boards and columns, cards, plus shared
request/response types, error mapping, security and STOMP messaging.

## Interface
- `KanbanApplication` (`@SpringBootApplication`): `main(String[])` calls
  `SpringApplication.run`. Component scanning covers every sub-package below.
- Sub-packages:
  - [`UserSpace`](./UserSpace/README.md): the `Users` entity, signup, login
    (JWT), self-service account delete. `/user/**`.
  - [`WorkSpace`](./WorkSpace/README.md): workspaces, membership, the `Role`
    enum, `GET /workspace/mine` (the main read used by the frontend), and
    `WorkspaceAccess`, the shared permission check. `/workspace/**`,
    `/member/**`.
  - [`Team`](./Team/README.md): teams within a workspace, member add/remove.
    `/team/**`.
  - [`Boards`](./Boards/README.md): `Board` and `Colum` entities, their
    services and `BoardMapper`. `/board/**`, `/column/**`.
  - [`Card`](./Card/README.md): the `Card` entity with `@Version`, card CRUD
    and move, and the after-commit STOMP broadcast. `/card/**`.
  - [`DTO`](./DTO/README.md): request bodies.
  - [`Response`](./Response/README.md): response shapes (Workspace → Board →
    Column → Card nesting).
  - [`Errors`](./Errors/README.md): `GlobalExceptionHandler`, which maps
    optimistic-lock, not-found and constraint-violation exceptions.
  - [`authentication`](./authentication/README.md): Spring Security, JWT,
    Google OAuth2, CORS.
  - [`Websockets`](./Websockets/README.md): the receive-only STOMP endpoint
    `/ws`, its CONNECT/SUBSCRIBE checks and the simple broker on `/topic`.

## Invariants
- Permissions are decided in one place, `WorkSpace/WorkspaceAccess`, always
  from the caller that `JwtFilter` put in the SecurityContext, never from an
  id in the request body:
  - any workspace role can read;
  - OWNER, ADMIN and MEMBER can change boards, columns and cards (a MEMBER
    must also be on the board's team when it has one);
  - OWNER and ADMIN manage workspace and team membership.
- Cross-package service calls:
  - `Boards`, `Card`, `Team` and `WorkSpace` services →
    `WorkSpace.WorkspaceAccess`.
  - `WorkSpace.WorkspaceService.getMyWorkspaces` →
    `Boards.BoardService.toResponse` (maps loaded boards, no re-query).
  - `UserSpace` → `authentication.JwtService` to issue tokens.
  - `authentication` and `Websockets` → `UserSpace.UserRepo` (via
    `MyuserDetailsService`).
- Ownership cascades: `Workspace` → `Board` → `Colum` → `Card`, all
  `cascade=ALL`. The board → column and column → card links also have
  `orphanRemoval=true`. Deleting a workspace removes everything under it.
- Only `Card` has optimistic locking. A move returns 409 when the client's
  `version` is stale, or when two moves overlap on the server.
- Controllers return 200 with the body. Every failure is a
  `ResponseStatusException` (400/401/403/404/409) thrown by a service.

## Side Effects
- On startup: JPA connects to PostgreSQL with `ddl-auto=update`, and
  `JwtService` loads its signing key from `jwtsecret`. If that is unset, it
  generates a temporary key and logs a warning.
- No beans are registered in this root package beyond Boot auto-configuration.

## Verification
- Run: `mvn test` (from the repository root). The unit tests under
  `src/test/java/.../Kanban/<package>/` need no database.
  `KanbanApplicationTests` starts the full context and needs PostgreSQL.
