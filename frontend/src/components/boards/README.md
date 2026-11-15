# boards

## Overview
The Boards library row and the progress ring it shows. `BoardCard` renders one already-derived board record (from `src/api/boardsApi.js`) as a clickable list row.

## Interface
- `BoardCard` (default export) `{ board, index = 0, onOpen, isStarred = false, onToggleStar }`. It reads `board.{ name, workspaceName, members, progress, lastVisitedAt }` [BoardCard.jsx:BoardCard]
- `ProgressRing` (default export) `{ percent, delay = 0 }`: a 16px SVG ring with the percentage as text [ProgressRing.jsx:ProgressRing]

## Invariants
- When `progress.known` is false, the row never invents a card total: it shows a column count, or "No cards yet" if there are no columns [BoardCard.jsx:progressLabel]
- The ring appears only when `progress.known && progress.total > 0`. Otherwise a spacer keeps the columns aligned [BoardCard.jsx:hasRing]
- The star button appears only when `onToggleStar` is a function. Its click and key events stop propagation so they do not also open the board [BoardCard.jsx:canStar]
- The row opens on click, Enter, or Space and calls `onOpen(board)` [BoardCard.jsx:open]
- At most `MAX_AVATARS = 3` member avatars show, then a `+N` counter [BoardCard.jsx:MAX_AVATARS]
- `ProgressRing` clamps the drawn arc to 0-100. The arc is drawn at its final length and only animates in through CSS variables, so the value is correct even if the animation never plays [ProgressRing.jsx:ProgressRing]

## Side Effects
- None. Pure presentation. Starring and navigation are delegated to the callbacks.

## Verification
- Run: `npm test -- src/components/boards` (from `frontend/`)
