# board

## Overview
Board-page add-ons that sit around the Kanban stage: the header's team-members popover, the "Display" options popover, the "Hidden columns" side panel, and the "Create a board" dialog. The stage itself (`KanbanBoard`, `KanbanColumn`, `TaskCard`) is in the parent directory; see [../README.md](../README.md).

## Interface
- `BoardMembers` (default export) `{ teamName, members = [], onAddPeople }`: an avatar stack (`MAX_AVATARS = 4`, then a `+N` chip) that opens a list of names and emails. The "Add people" button appears only when `onAddPeople` is passed [BoardMembers.jsx:BoardMembers]
- `DisplayMenu` (default export) `{ display, onChange }`: switches for `showDescriptions` and `showEmptyColumns`. Each change reports only the flipped key, as `onChange({ [key]: checked })` [DisplayMenu.jsx:OPTIONS, DisplayMenu]
- `HiddenColumns` (default export) `{ columns = [], onShow, onMoveCard }`: a collapsible panel listing hidden columns. Each row is a drop target and has a "Show column" button that calls `onShow(columnId)` [HiddenColumns.jsx:HiddenColumns, HiddenRow]
- `CreateBoardModal` (default export) `{ workspace, onSubmit, onClose }`: collects a board name, a team, and optionally people to add. `onSubmit({ name, teamId, userIds })` must resolve to `{ failed, open }` [CreateBoardModal.jsx:CreateBoardModal]

## Invariants
- `HiddenColumns` renders nothing when `columns` is empty [HiddenColumns.jsx:HiddenColumns]
- A drop on a hidden row reads the JSON `text/plain` payload. Payloads without `cardId`, or that fail to parse, are ignored. Valid drops call `onMoveCard(cardId, sourceColumnId, column.columnId, count)`, so the card lands at the bottom of that column [HiddenColumns.jsx:readDrop, HiddenRow]
- `DisplayMenu` keeps only its open/closed state. The option values are owned by the caller [DisplayMenu.jsx:DisplayMenu]
- The `BoardMembers` and `DisplayMenu` popovers close on an outside press or Escape, through `useDismiss` [BoardMembers.jsx:BoardMembers, DisplayMenu.jsx:DisplayMenu]
- `CreateBoardModal` fetches nothing. Teams come from `workspace.teams` and candidate people from `availableMembers({ members: team.members, workspacePeople: workspace.people })` [CreateBoardModal.jsx:CreateBoardModal]
- The people list appears only when `canManageTeam(workspace.role)` is true. Otherwise `userIds` is always `[]` [CreateBoardModal.jsx:PeopleSection, createBoard]
- The submit button needs a trimmed non-empty name, a chosen team, and no submission in flight. Team ids are compared as strings [CreateBoardModal.jsx:canSubmit, team]
- Only people still listed as candidates are sent, in the order the list shows them [CreateBoardModal.jsx:createBoard]
- A partial failure (`result.failed` is non-empty) means the board already exists. The dialog then stays open, disables the name and team fields, lists who was not added, and turns the primary button into "Open board" (calls `result.open()`), so a retry cannot create a second board [CreateBoardModal.jsx:createBoard, handleSubmit, submitLabel]

## Side Effects
- `useDismiss` adds `pointerdown` and `keydown` listeners on `document` while a popover is open [BoardMembers.jsx:BoardMembers, DisplayMenu.jsx:DisplayMenu]
- `CreateBoardModal` makes no network calls itself. Board creation and team membership happen in the caller's `onSubmit` (for example `Sidebar`'s `WorkspaceTree.handleCreate`; see [../shell/README.md](../shell/README.md)) [CreateBoardModal.jsx:createBoard]

## Verification
- Run: `npm test -- src/components/board` (from `frontend/`)
