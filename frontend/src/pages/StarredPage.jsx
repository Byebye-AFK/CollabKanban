import React from 'react'
import BoardLibraryPage from './BoardLibraryPage'
import { filterStarred } from '../api/starredApi'

/**
 * StarredPage — the boards the user has starred.
 *
 * Stars live in this browser rather than on the server (see starredApi),
 * so this is the Boards page over a smaller set: unstarring a board here
 * takes it off the page as soon as the star is pressed.
 */
export default function StarredPage(props) {
  return (
    <BoardLibraryPage
      {...props}
      railId="starred"
      title="Starred"
      toolbarTitle="Starred boards"
      flatLabel="All starred"
      searchPlaceholder="Search starred boards…"
      searchLabel="Search starred boards"
      emptyMessage="No starred boards yet — press the star on a board to keep it here."
      selectBoards={filterStarred}
    />
  )
}
