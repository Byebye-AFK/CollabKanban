# DTO

## Overview
Request payload classes that controllers bind from JSON request bodies. Each one
is a plain mutable POJO with Lombok `@Getter`/`@Setter`. They carry no
validation annotations. Each service validates the fields it needs and answers
400 for missing or blank values.

## Interface
| Class | Fields | Used for |
|---|---|---|
| `AddWorkspaceMember` | `Long userId`, `Long workSpaceId`, `Role role` (`WorkSpace.Role`) | `POST /member/addmembership` |
| `CreateBoardReq` | `String name`, `Long workspaceId`, `Long position`, `Long teamId` (optional) | `POST /board/create` |
| `CreateCardReq` | `String title` (declared `public`), `String description`, `Long columnId`, `Long assignedTo`, `Long position` | `POST /card/create` |
| `CreateColumReq` | `String name`, `Long boardId`, `Long position` | `POST /column/create` |
| `CreateTeamReq` | `String teamName`, `Long workSpaceId` (package-private fields) | `POST /team/add` |
| `CreateUserReq` | `String name`, `String email`, `String password` | `POST /user/add`, and as the response of signup and delete with `password: null` |
| `CreateWorkspaceReq` | `String name` | `POST /workspace/create` |
| `MoveCardReq` | `Long boardId`, `Long targetColumnId`, `Long position`, `Long version` (optional) | `PUT /card/move/{id}` |
| `TeamMemberCreateReq` | `Long userId`, `Long teamId` | `POST /team/addMember`, `DELETE /team/removeMember` |
| `UserAuthReq` | `String email`, `String password` | `POST /user/login` |

## Invariants
- No user id in a body is trusted as the caller. The caller always comes from
  the JWT through `WorkSpace/WorkspaceAccess.currentUser()`. Body ids name the
  target (the user to add, the team to change).
- `CreateBoardReq.teamId` is optional. When it is given, the team must belong
  to the same workspace (400 otherwise).
- `CreateColumReq.position` and `CreateCardReq.position` are optional. When
  sent they are used as given; otherwise the server appends at the current
  highest position + 1000 (1000 when empty).
- `MoveCardReq.version` is optional. When it is sent and differs from the
  card's `@Version`, the move is rejected with 409. `MoveCardReq.boardId` is
  not read: the server takes the board from the card's column, and the target
  column must be on that same board (400 otherwise).
- Field visibility varies: `CreateCardReq.title` is `public`, and the
  `CreateTeamReq` fields are package-private. Callers use the Lombok accessors.

## Side Effects
- None. These are pure data holders.

## Verification
- Run: `mvn test` (from the repository root)
