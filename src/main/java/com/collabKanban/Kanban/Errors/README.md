# Errors

## Overview
One `@RestControllerAdvice`, `GlobalExceptionHandler`, turns three persistence
exceptions into HTTP errors. The body has the same JSON shape as Spring's
default error response, so the frontend's `parseApiError` reads both the same
way.

## Interface
| Handler | Exception | Status | `message` |
|---|---|---|---|
| `handleStaleWrite` | `OptimisticLockingFailureException` (and subclasses, e.g. `ObjectOptimisticLockingFailureException`) | 409 CONFLICT | "Someone else changed this card first. Reload and try again." |
| `handleMissingEntity` | `jakarta.persistence.EntityNotFoundException` | 404 NOT_FOUND | "That item no longer exists." |
| `handleDuplicate` | `DataIntegrityViolationException` | 409 CONFLICT | "That already exists." |

All three return `ResponseEntity<Map<String,Object>>`, built by the private
`error()` helper, with the body
`{ timestamp, status, error, message, path }`. `timestamp` is
`Instant.now().toString()` and `path` is `request.getRequestURI()`.

## Invariants
- There is deliberately no catch-all `Exception`/`Throwable` handler. Every
  other exception, including the `ResponseStatusException`s thrown by the
  services, falls through to Spring's default error handling with the same
  body shape.
- A 409 on a card move has two sources, and the frontend resyncs the board on
  either:
  - the explicit version check in `Card/CardService`, which throws
    `ResponseStatusException(CONFLICT, ...)` when the version the client sent
    is stale (it never reaches this handler);
  - `handleStaleWrite`, when two move transactions overlap on the server and
    the `@Version` check in [`../Card/README.md`](../Card/README.md) fails at
    flush.
- `handleDuplicate` is the backstop for unique columns. Signup checks for an
  existing email first and answers its own 409, so this handler only sees a
  race between two signups.
- A handler only sees exceptions that reach it unwrapped. Services throw
  `ResponseStatusException` or let these exceptions propagate as they are.

## Side Effects
- Each handler logs the request URI and the exception at DEBUG level through
  SLF4J.

## Verification
- Run: `mvn test` (from the repository root)
