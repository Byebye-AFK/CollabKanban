# WorkSpace

## Overview
Workspaces and workspace membership: JPA entities, repositories, services, two
controllers and `WorkspaceAccess`, the shared authorization helper. It can
create a workspace (the creator becomes its `OWNER`), add a member with a role,
and return every workspace the caller belongs to. That last call,
`GET /workspace/mine`, is the main data source for the frontend's dashboard,
boards and teams pages.

## Interface
- `WorkspaceController` (`@RequestMapping("workspace")`):
  - `POST /workspace/create`: body `CreateWorkspaceReq`, returns a
    `WorkSpaceResponse` (id, name, role `OWNER`, empty `boards`, `teams` and
    `members` lists). It no longer returns the JPA entity.
  - `GET /workspace/mine`: returns `List<WorkSpaceResponse>`. It reads no
    header itself; the caller comes from the SecurityContext.
- `WorkspacMemberController` (`@RequestMapping("/member")`; the class name has
  this spelling): `POST /member/addmembership`, body `AddWorkspaceMember`,
  returns `RoleResponse`.
- `WorkspaceService`: `createWorkspace(CreateWorkspaceReq)`,
  `getMyWorkspaces()`.
- `WorkspaceMemberService`: `addMembership(Long workSpaceId, Long userId, Role role)`.
- `WorkspaceAccess` (`@Service`): `currentUser()`, `requireRole`,
  `requireMember`, `requireManager`, `requireBoardReader`,
  `requireBoardEditor`, and the role sets `ALL_ROLES`, `EDITORS`, `MANAGERS`.
  See its class comment for the policy.
- `Workspace` (`@Entity`):
  - `workspaceId`: IDENTITY.
  - `name`: `nullable=false`.
  - `members`: `@OneToMany(mappedBy="workspace", cascade=ALL)`.
  - `boards`: `@OneToMany(mappedBy="workspace", cascade=ALL)`.
  - `teamsBworkspace`: `@OneToMany(mappedBy="workspaces", cascade=ALL)`.
- `WorkspaceMembers` (`@Entity`):
  - `workspacMemberId`: IDENTITY.
  - `user`: `@ManyToOne` on `userId`, not null.
  - `workspace`: `@ManyToOne` on `workspaceId`, not null.
  - `role`: `@Enumerated(STRING)`.
  - Table constraint: `@UniqueConstraint(userId, workspaceId)`.
- `Role` enum: `OWNER`, `ADMIN`, `MEMBER`, `VIEWER`.
- `WorkspaceRepo`: `findByWorkspaceId(Long)` plus the inherited `findById`.
- `WorkspaceMemberRepo`, with `@Query` methods:
  - `findWorkspacesUserBelong(Users)`.
  - `findMembersnWorkspaceExceptUser(Workspace, Users)`.
  - `getRoleOfMember(Users, Workspace)`.

## Invariants
- The caller is always `WorkspaceAccess.currentUser()`, never a user id from
  the request body. No valid token means 401 "Please sign in again".
- `createWorkspace` (`@Transactional`):
  1. 400 "Give the workspace a name" for a missing or blank name (the name is
     trimmed).
  2. Saves the workspace and a `WorkspaceMembers` row making the caller
     `OWNER`, in one transaction.
- `addMembership` (`@Transactional`) checks, in order:
  1. 400 if `workSpaceId` or `userId` is missing; 400 "role is required".
  2. 404 "Workspace not found".
  3. The caller must be `OWNER` or `ADMIN` of the workspace (403 otherwise).
  4. 403 "Only an owner can make someone an owner" when an `ADMIN` grants
     `OWNER`.
  5. 404 "User not found".
  6. 409 "`<name>` is already a member of this workspace". The unique
     constraint stays as a backstop for concurrent requests.
- `getMyWorkspaces` (`@Transactional(readOnly = true)`) returns only workspaces
  where the caller has a membership row. Each entry has the id, the name, the
  caller's role, the *other* members, boards (mapped from the loaded entities
  by `BoardService.toResponse`, no per-board refetch) and teams with their
  members.
- Controllers always return 200 with the body. Errors are
  `ResponseStatusException`s thrown by the services.

## Side Effects
- `createWorkspace` inserts a `Workspace` row and an `OWNER`
  `WorkspaceMembers` row. `addMembership` inserts a `WorkspaceMembers` row.
- `Workspace` cascades every operation to its members, boards and teams, and
  from boards on to columns and cards.
- `getMyWorkspaces` still runs a role query and a members query per workspace;
  boards and teams load through the entity's lazy collections in one session.

## Verification
- Unit tests: `src/test/java/com/collabKanban/Kanban/WorkSpace/`
  (`WorkspaceServiceTest`, `WorkspaceMemberServiceTest`).
- Run: `mvn test` (from the repository root)
