# library

## Overview
Content-agnostic building blocks for the Boards and Teams library pages: a grid that can be flat or grouped by workspace, its loading skeleton, and the toolbar with the grouping switch and sort menu.

## Interface
- `LibraryGrid` (default export) `{ items, view, noun, renderItem, getKey }`. With `view === 'grouped'`, items are grouped with `groupByWorkspace(items)` from `src/api/library.js` into collapsible sections. Any other value renders one flat `.lib-grid`. The caller draws each card through `renderItem(item, staggerIndex, key)` [LibraryGrid.jsx:LibraryGrid, WorkspaceGroup]
- `LibraryGridSkeleton` (default export), no props: six placeholder rows (`PLACEHOLDER_COUNT`) in the final layout, `aria-hidden` [LibraryGridSkeleton.jsx:LibraryGridSkeleton]
- `LibraryToolbar` (default export) `{ title, noun, count, total, sorts, sort, onSortChange, view, onViewChange, flatLabel = 'All', children }`. It offers the views `grouped` and `flat`, and `children` is placed in the right-hand action group [LibraryToolbar.jsx:LibraryToolbar, VIEWS]

## Invariants
- The stagger index runs continuously across groups and is capped at `MAX_STAGGER_STEPS = 14` [LibraryGrid.jsx:staggerIndex, MAX_STAGGER_STEPS]
- Each workspace group starts expanded and collapses on its own [LibraryGrid.jsx:WorkspaceGroup]
- `sorts` must contain at least one entry: an unknown `sort` id falls back to `sorts[0].label` [LibraryToolbar.jsx:sortLabel]
- The toolbar says "`count` of `total`" whenever `count !== total` (a filtered view) [LibraryToolbar.jsx:isFiltered]
- Choosing a sort calls `onSortChange(id)` and closes the menu. The menu also closes on an outside `pointerdown` or Escape [LibraryToolbar.jsx:LibraryToolbar]
- There is no search box here. Search lives in the page header [LibraryToolbar.jsx:LibraryToolbar]

## Side Effects
- While the sort menu is open, `LibraryToolbar` adds `pointerdown` and `keydown` listeners on `document`, removed when it closes [LibraryToolbar.jsx:LibraryToolbar]
- No network or storage access.

## Verification
- Run: `npm test -- src/components/library` (from `frontend/`)
