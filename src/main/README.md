# CollabKanban Backend Blueprint

## System Overview
Spring Boot 4.0.6 (Java 21, Maven) REST and STOMP backend for CollabKanban. It
serves the React frontend on `http://localhost:5173` from
`http://localhost:8080`. Data is stored in PostgreSQL through JPA
(`ddl-auto=update`, so there are no migrations).

Requests are authenticated with a stateless JWT bearer token, issued by
`/user/login` or by the Google OAuth2 success redirect. All writes go over
REST. A card move is also broadcast after commit to `/topic/board/{boardId}`
over the receive-only STOMP endpoint `/ws`, which uses an in-memory simple
broker.

```
React SPA ──REST + Bearer JWT──▶ Controllers ─▶ Services ─▶ JPA repos ─▶ PostgreSQL
    ▲                                   │            │
    │                                   │      WorkspaceAccess (permissions)
    └── STOMP /topic/board/{id} ◀── CardMoveBroadcaster (AFTER_COMMIT)
        (CONNECT needs a JWT; SUBSCRIBE needs workspace membership)
```

## Subdirectories & System Boundaries
- java: [`./java/README.md`](./java/README.md) - the Java source root. The
  application package is described in
  [`./java/com/collabKanban/Kanban/README.md`](./java/com/collabKanban/Kanban/README.md).
- resources: `application.properties` only (it has no README). It sets the
  datasource URL, JPA settings, error detail, the Google OAuth client
  registration, `jwt.secret` and `app.frontend-url`. Values come from the env
  vars `username`, `pass`, `googleclient`, `googlepass`, `jwtsecret` and,
  optionally, `frontendurl`.

## Global Invariants
- Public routes are `/user/add`, `/user/login`, `/oauth2/**`,
  `/login/oauth2/**`, `/ws/**` and `/error`. Every other route needs a valid
  `Authorization: Bearer <jwt>`. A missing, malformed, expired or wrongly
  signed token, or a token for a deleted user, leaves the request
  unauthenticated, and protected routes answer 401.
- CORS and the WebSocket endpoint allow only `http://localhost:5173`.
- The JWT signing key comes from `jwtsecret` (Base64, at least 32 bytes), so
  tokens survive restarts. If the variable is unset, a temporary key is
  generated and a warning is logged.
- Permissions are enforced on every route through `WorkSpace/WorkspaceAccess`:
  - members read;
  - OWNER, ADMIN and MEMBER edit boards, columns and cards (a MEMBER must also
    be on the board's team, if it has one);
  - OWNER and ADMIN manage people, and only an OWNER can grant OWNER;
  - users can delete only their own account.
- Creating a workspace makes the creator its OWNER.
- Error bodies use Spring's `{timestamp,status,error,message,path}` shape.
  Services throw `ResponseStatusException`s, and
  `Errors/GlobalExceptionHandler` also maps:
  - optimistic-lock failures to 409;
  - `EntityNotFoundException` to 404;
  - constraint violations to 409.
- Only `Card` has optimistic locking. Moves carry an optional `version`, and a
  stale one gets 409.
- Columns and cards are returned sorted by `position`.
- Ownership cascades `Workspace` → `Board` → `Colum` → `Card`.

## Global Side Effects
- PostgreSQL: all reads and writes, and schema auto-update on startup.
- STOMP: after commit, a card move broadcasts the full `CardResponse`,
  including `version`, to `/topic/board/{boardId}`. The broker keeps no
  history, so clients refetch after a reconnect.
- Google OAuth2: on first login a `Users` row is created with the Google
  display name. The browser is then redirected to
  `<frontendurl>/oauth2/callback#token=<jwt>`. The token is in the fragment,
  so it is never sent to a server.
- Logging goes through SLF4J. There are no `System.out` calls.

## System Verification
- Run: `mvn test` (from the repository root; there is no `mvnw` wrapper).
