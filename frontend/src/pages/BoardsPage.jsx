import React from 'react'
import BoardLibraryPage from './BoardLibraryPage'

/**
 * BoardsPage — every board the user can reach, on one page.
 *
 * The page itself is BoardLibraryPage, which Starred shares; this only
 * says which boards to keep and what to call them.
 */
export default function BoardsPage(props) {
  return (
    <BoardLibraryPage
      {...props}
      railId="boards"
      title="Boards"
      toolbarTitle="All boards"
      flatLabel="All boards"
      searchPlaceholder="Search boards and workspaces…"
      searchLabel="Search boards"
      emptyMessage="No boards yet — create one from a workspace to get started."
    />
  )
}
