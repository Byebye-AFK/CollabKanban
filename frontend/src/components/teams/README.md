# teams

## Overview
Teams library row and the dialogs that create teams and add people to them. `PeoplePicker` is also reused by `../board/CreateBoardModal.jsx`.

## Interface
- `TeamCard` (default export) `{ team, index = 0, largest = 1, onAddMembers }` — reads `team.{ name, workspaceName, memberCount, role }`; size meter is `memberCount / largest` [TeamCard.jsx:TeamCard]
- `CreateTeamModal` (default export) `{ workspaces, initialWorkspaceId, onSubmit, onClose }` — `onSubmit({ name, workspaceId })` resolves on success, rejects with a user-facing message [CreateTeamModal.jsx:CreateTeamModal]
- `AddTeamMembersModal` (default export) `{ team, onSubmit, onClose }` — `onSubmit(userIds)` must resolve to `{ added, failed }` (`failed: {userId, message}[]`) [AddTeamMembersModal.jsx:AddTeamMembersModal]
- `PeoplePicker` (default export) `{ people, selected, onToggle, children }` — checkbox list; `selected` is a caller-owned `Set` of user ids [PeoplePicker.jsx:PeoplePicker]
- `toggled(set, id)` — returns a new `Set` with `id` flipped; never mutates `set` [PeoplePicker.jsx:toggled]

## Invariants
- `TeamCard` makes no permission decision: the "Add" button renders only when the page passes `onAddMembers` [TeamCard.jsx:TeamCard]
- `CreateTeamModal`: `workspaces` is expected pre-narrowed by the caller (see `teamHomes` in `src/api/teamsApi.js`); default workspace is `initialWorkspaceId ?? workspaces[0]?.workspaceId`; select values are coerced with `Number(...)`; submit requires trimmed name and a workspace; on rejection the dialog stays open showing `err.message` [CreateTeamModal.jsx:CreateTeamModal]
- `AddTeamMembersModal`: candidates are `availableMembers(team)` minus people this dialog already added (`justAdded`), so a retry never re-adds anyone [AddTeamMembersModal.jsx:candidates]
- `AddTeamMembersModal`: ids are submitted in list order; on partial failure the dialog stays open with only the failed ids re-selected and their messages shown; closes when `failed.length === 0` [AddTeamMembersModal.jsx:handleSubmit]
- Search filter matches `name` + `email`, case-insensitive, trimmed [AddTeamMembersModal.jsx:visible]

## Side Effects
- None inside these components: team creation and membership writes happen in the caller's `onSubmit` (network via `src/api/teamsApi.js`).
- `AddTeamMembersModal` and `PeoplePicker` import `./teams.css` [AddTeamMembersModal.jsx, PeoplePicker.jsx]

## Verification
- Run: `npm test -- src/components/teams` (from `frontend/`)
