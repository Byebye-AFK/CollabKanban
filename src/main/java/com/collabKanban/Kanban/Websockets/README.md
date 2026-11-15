# Websockets

## Overview
Receive-only STOMP over a native WebSocket. The broker is Spring's in-memory
simple broker, with no external relay. The server publishes; clients only
subscribe. Live board updates are sent from
[`../Card/README.md`](../Card/README.md) (`CardMoveBroadcaster`), not from
this package. All writes go over REST.

## Interface
- `WebSocketConfig.registerStompEndpoints`: STOMP endpoint `/ws`, no SockJS,
  `setAllowedOrigins("http://localhost:5173")` (the same single origin REST
  CORS allows).
- `WebSocketConfig.configureMessageBroker`: `enableSimpleBroker("/topic")`. No
  application destination prefix, because there are no `@MessageMapping`
  handlers.
- `WebSocketConfig.configureClientInboundChannel`: registers
  `StompAuthInterceptor`.
- `StompAuthInterceptor` (`ChannelInterceptor`):
  - `CONNECT` / `STOMP`: requires the native header
    `Authorization: Bearer <jwt>`. The email comes from
    `JwtService.extractUserName`, the user from `MyuserDetailsService`, and
    `JwtService.validateToken` must pass. The session user is then set to a
    `UsernamePasswordAuthenticationToken` whose principal is `DetailsOfUser`.
    A missing or invalid token (including `JwtException` and
    `UsernameNotFoundException`) throws `MessageDeliveryException`, which makes
    Spring send an ERROR frame and close the session.
  - `SUBSCRIBE`: allowed only to `/topic/board/{boardId}`, and only when the
    session user has any role in that board's workspace
    (`BoardRepo.findById` + `WorkspaceMemberRepo.getRoleOfMember`). Any other
    destination, an unknown board or a non-member throws `AccessDeniedException`.
  - `SEND`: always rejected with `AccessDeniedException`. Without this, a SEND
    to `/topic/...` would go straight to every subscriber.
  - Other frames (heartbeats, `UNSUBSCRIBE`, `DISCONNECT`) pass through.

## Invariants
- `/ws/**` is public in `authentication/Security` so the handshake can happen;
  `JwtFilter` never sees STOMP frames. The interceptor is the only check on the
  socket.
- `WorkspaceAccess` is not used here: STOMP frames have no HTTP
  SecurityContext, so the user comes from the STOMP session.
- `Board.workspace` is an eager `@ManyToOne`, so the membership check needs no
  open persistence session.
- The simple broker keeps no history. A subscriber that reconnects misses
  every message sent while it was disconnected; the frontend refetches the
  board after a reconnect.
- The frontend (`frontend/src/api/socket.js`) sets the CONNECT header in
  `beforeConnect`, so every reconnect sends the current `localStorage.jwt_token`.

## Side Effects
- Read-only database lookups (user, board, workspace role) on CONNECT and
  SUBSCRIBE. Rejections are logged at DEBUG through SLF4J.

## Verification
- Unit tests: `src/test/java/com/collabKanban/Kanban/Websockets/StompAuthInterceptorTest.java`
- Run: `mvn test` (from the repository root)
