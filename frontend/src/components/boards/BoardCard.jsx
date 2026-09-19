import React from 'react'
import Avatar from '../Avatar'
import ProgressRing from './ProgressRing'
import { colorFor } from '../shell/palette'
import { progressPercent } from '../../api/boardsApi'
import { relativeTime } from '../../api/dashboardApi'

/**
 * One board, on its own pane of glass.
 *
 * Carries enough workspace context to stand alone in the flat view —
 * the tint and the chip both come from the workspace name, so boards
 * from the same workspace read as a set however the grid is sorted.
 */

/** Members shown before the stack collapses into a +N counter. */
const MAX_AVATARS = 3

/** Per-card stagger applied to the ring draw-in, on top of the card's own. */
const RING_DELAY_MS = 260

function initial(name = '') {
  return name.trim().slice(0, 1).toUpperCase() || '?'
}

/**
 * What the card says about its cards.
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

export default function BoardCard({ board, index = 0, onOpen }) {
  const { name, workspaceName, members, progress, lastVisitedAt } = board

  const color = colorFor(workspaceName)
  const percent = progressPercent(progress)
  const shown = members.slice(0, MAX_AVATARS)
  const extra = members.length - shown.length

  const open = () => onOpen?.(board)

  return (
    <article
      className="lib-card dsh-glass dsh-in"
      style={{ '--in': `${index * 55}ms`, '--tint': color }}
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open() }
      }}
      aria-label={`Open ${name} in ${workspaceName}`}
    >
      <div className="lib-card-head">
        <span className="lib-mark" style={{ background: `linear-gradient(145deg, ${color}, ${color}A6)` }}>
          {initial(name)}
        </span>
        {progress.known && progress.total > 0 && (
          <ProgressRing percent={percent} color={color} delay={RING_DELAY_MS + index * 55} />
        )}
      </div>

      <h4 className="lib-name" title={name}>{name}</h4>
      <span className="dsh-chip lib-ws-chip">
        <i style={{ background: color }} aria-hidden="true" />
        {workspaceName}
      </span>

      <div className="lib-card-foot">
        <div className="dsh-stack">
          {shown.map(m => <span key={m}><Avatar name={m} size={26} /></span>)}
          {extra > 0 && <span className="dsh-more">+{extra}</span>}
          {shown.length === 0 && <span className="lib-nomembers">No members</span>}
        </div>
        <span className="lib-meta">
          {progressLabel(progress)}
          {lastVisitedAt && <> · {relativeTime(lastVisitedAt)}</>}
        </span>
      </div>
    </article>
  )
}
