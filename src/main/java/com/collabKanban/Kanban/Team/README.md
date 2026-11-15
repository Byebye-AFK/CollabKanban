# Team

## Overview
Teams inside a workspace: create a team, add and remove members. The package
has two JPA entities (`Team`, `TeamMembers`), two repositories, two services
and one controller under `/team`. Whether a user may change a team board is
decided by `WorkSpace/WorkspaceAccess.requireBoardEditor`, not by this package.

## Interface
- `TeamController` (`@RequestMapping("team")`). No endpoint reads the
  `Authorization` header itself; the services take the caller from
  `WorkspaceAccess.currentUser()`.
  - `POST /team/add`: body `CreateTeamReq`, returns `TeamResponse`
    (`teamId`, `teamName`, `count`, empty `members`).
  - `POST /team/addMember`: body `TeamMemberCreateReq`, returns
    `TeamMemberRes`.
  - `DELETE /team/removeMember`: body `TeamMemberCreateReq`, returns
    `TeamMemberRes`.
- `TeamService`: `createTeam(CreateTeamReq)` (`@Transactional`).
- `TeamMembersService`:
  - `addMembers(TeamMemberCreateReq)` (`@Transactional`).
  - `removeMembers(TeamMemberCreateReq)` (`@Transactional`).
- `Team` (`@Entity`):
  - `teamId`: IDENTITY.
  - `name`.
  - `count` (default 0).
  - `teamMembers`: `@OneToMany(mappedBy="teams", cascade=ALL)`.
  - `workspaces`: `@ManyToOne` on `workspaceId`.
  - `boards`: `@OneToMany(mappedBy="team")`, no cascade.
- `TeamMembers` (`@Entity`):
  - `teamMemberId`: IDENTITY.
  - `members`: `@ManyToOne Users` on `userId`.
  - `teams`: `@ManyToOne Team` on `teamId`.
  - Table constraint: `@UniqueConstraint(userId, teamId)`.
- `TeamRepo`:
  - `findByteamId(Long)`.
  - `deleteByUserandTeam(Users, Team)`: a JPQL `DELETE` marked `@Modifying`
    (`clearAutomatically=true`), `@Transactional`.
- `TeamMemberRepo`: `findBymembers(Users)`, `findByteams(Team)`,
  `existsByMembersAndTeams(Users, Team)`.

## Invariants
- Every write needs the caller to be `OWNER` or `ADMIN` of the team's
  workspace (`WorkspaceAccess.requireManager`): 403 otherwise.
- `createTeam` checks, in order:
  1. 400 "Give the team a name" for a missing or blank name (trimmed).
  2. 400 "workSpaceId is required".
  3. 404 "Workspace not found".
  4. 403 unless the caller manages the workspace.
- `addMembers` checks, in order:
  1. 400 if `req`, `userId` or `teamId` is null.
  2. 404 "Team not found".
  3. 400 "Team is not attached to a workspace".
  4. 403 unless the caller manages the workspace.
  5. 404 "User not found".
  6. 400 "`<name>` is not a member of this workspace".
  7. 409 "`<name>` is already on `<team>`".
- `removeMembers` checks, in order:
  1. 400 if `req`, `userId` or `teamId` is null.
  2. 404 "Team not found", 404 "User not found".
  3. 400 "Team is not attached to a workspace".
  4. 403 unless the caller manages the workspace.
  5. 404 "`<name>` is not on `<team>`".
- `Team.count` always equals the number of `TeamMembers` rows after a write:
  add and remove both recompute it from `findByteams(team)`.
- The database also enforces that each (userId, teamId) pair is unique.

## Side Effects
- `createTeam` saves the `Team` (`count = 1`) and a `TeamMembers` row for the
  creator in one transaction.
- `addMembers` saves a `TeamMembers` row, then recomputes and saves
  `team.count`, in one transaction.
- `removeMembers` deletes the row with a bulk JPQL `DELETE`, which clears the
  persistence context, so it re-reads the team before writing the recomputed
  count. All in one transaction.
- Deleting a `Team` cascades to its `TeamMembers` but not to its boards.

## Verification
- Unit tests: `src/test/java/com/collabKanban/Kanban/Team/`
  (`TeamServiceTest`, `TeamMembersServiceTest`).
- Run: `mvn test` (from the repository root)
