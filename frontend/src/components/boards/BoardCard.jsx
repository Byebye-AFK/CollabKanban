import React from 'react'
import Avatar from '../Avatar'
import ProgressRing from './ProgressRing'
import { StarIcon, BoardIcon } from '../shell/icons'
import { colorFor } from '../shell/palette'
import { progressPercent } from '../../api/boardsApi'
import { relativeTime } from '../../api/dashboardApi'

/**
 * One board as a list row: name and workspace on the left, progress,
 * members and the star on the right.
 *
 * Carries enough workspace context to stand alone in the flat view —
 * the chip's dot comes from the workspace name, so boards from the same
 * workspace read as a set however the list is sorted.
 */

/** Members shown before the stack collapses into a +N counter. */
const MAX_AVATARS = 3

/** Per-row stagger, in ms. */
const STAGGER_MS = 30

/**
 * What the row says about its cards.
 *
 * A board whose payload carried no card information says so by counting
 * columns instead — never by showing a made-up total.
 */
function progressLabel(progress) {
  if (!progress.known) {
    return progress.columnCount
      ? `${progress.columnCount} column${progress.columnCount === 1 ? '' : 's'}`
      : 'No cards yet'
  }
  if (progress.total === 0) return 'No cards yet'
  return `${progress.done}/${progress.total} done`
}

export default function BoardCard({ board, index = 0, onOpen, isStarred = false, onToggleStar }) {
  const { name, workspaceName, members, progress, lastVisitedAt } = board

  const percent = progressPercent(progress)
  const shown = members.slice(0, MAX_AVATARS)
  const extra = members.length - shown.length

  const hasRing = progress.known && progress.total > 0
  const canStar = typeof onToggleStar === 'function'

  const open = () => onOpen?.(board)

  return (
    <article
      className="lib-card ui-in"
      style={{ '--in': `${index * STAGGER_MS}ms` }}
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open() }
      }}
      aria-label={`Open ${name} in ${workspaceName}`}
    >
      <span className="lib-icon" aria-hidden="true"><BoardIcon size={15} /></span>

      <h4 className="lib-name" title={name}>{name}</h4>
      <span className="ui-chip lib-ws-chip">
        <i style={{ '--c': colorFor(workspaceName) }} aria-hidden="true" />
        {workspaceName}
      </span>

      <span className="lib-meta">
        {progressLabel(progress)}
        {lastVisitedAt && <> · {relativeTime(lastVisitedAt)}</>}
      </span>

      {hasRing ? <ProgressRing percent={percent} delay={200 + index * STAGGER_MS} /> : <span className="lib-ring-gap" />}

      <span className="ui-avatars lib-members">
        {shown.map(m => <Avatar key={m} name={m} size={20} />)}
        {extra > 0 && <span className="ui-avatar is-more" style={{ '--size': '20px' }}>+{extra}</span>}
        {shown.length === 0 && <span className="lib-nomembers">No members</span>}
      </span>

      {canStar ? (
        <button
          className={`ui-iconbtn is-sm lib-star${isStarred ? ' is-on' : ''}`}
          // The row itself opens the board, so the star has to keep
          // both its click and its Enter/Space to itself.
          onClick={e => { e.stopPropagation(); onToggleStar(board) }}
          onKeyDown={e => e.stopPropagation()}
          aria-pressed={isStarred}
          aria-label={isStarred ? `Unstar ${name}` : `Star ${name}`}
          title={isStarred ? 'Remove from Starred' : 'Add to Starred'}
        >
          <StarIcon filled={isStarred} size={14} />
        </button>
      ) : <span className="lib-star-gap" />}
    </article>
  )
}
