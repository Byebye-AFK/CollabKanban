# Response

## Overview
Response classes that controllers serialize to JSON. They are Lombok
`@Getter`/`@Setter` POJOs, not records. The board view nests three levels
(`BoardResponse` → `ColumResponse` → `CardResponse`). `WorkSpaceResponse` is
returned by `POST /workspace/create` and, as a list, by `GET /workspace/mine`.
It nests members, boards and teams. Boards, columns and cards are mapped in
one place, `Boards/BoardMapper`; cards are also mapped by
`Card/CardService.toResponse`.

## Interface
| Class | Fields |
|---|---|
| `BoardResponse` | `Long teamId`, `Long boardId`, `Long position`, `String name`, `List<ColumResponse> columns` |
| `ColumResponse` | `Long position`, `Long columnId`, `String name`, `List<CardResponse> cards` |
| `CardResponse` | `Long cardId`, `String title`, `String description`, `Long position`, `Long assignedTo`, `Long version` |
| `RoleResponse` | `Long userId`, `Long workSpaceId`, `Role role`; constructor `RoleResponse(Long, Long, Role)` |
| `TeamMemberRes` | `Long userId`, `Long teamId` |
| `TeamResponse` | `Long teamId`, `String teamName`, `int count`, `List<UserResponse> members` |
| `UserResponse` | `Long userId`, `String userName`, `String userEmail` |
| `WorkSpaceResponse` | `Long workSpaceId`, `String name`, `Role role`, `List<UserResponse> members`, `List<BoardResponse> boards`, `List<TeamResponse> teams` |

## Invariants
- `columns` and `cards` are always sorted by `position` (nulls last, then id).
  `BoardResponse.position` and `ColumResponse.position` are filled.
- `CardResponse.assignedTo` is null for an unassigned card.
  `CardResponse.version` is the card's `@Version`; clients send it back on
  move so stale copies get 409.
- No response carries a password or a JPA entity.
- `RoleResponse` declares only its all-args constructor, so it has no no-args
  constructor.

## Side Effects
- None. These are pure data holders.

## Verification
- Run: `mvn test` (from the repository root)
