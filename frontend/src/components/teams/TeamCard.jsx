import React from 'react'
import { colorFor } from '../shell/palette'

/**
 * One team, on its own pane of glass.
 *
 * Shares the board card's shell so the two libraries read as one
 * system. Where a board shows completion, a team shows its size —
 * a meter scaled against the largest team on the page, so the bars
 * compare teams to each other rather than to an invented ceiling.
 */
function initial(name = '') {
  return name.trim().slice(0, 1).toUpperCase() || '?'
}

function memberLabel(count) {
  if (count === 0) return 'No members yet'
  return `${count} member${count === 1 ? '' : 's'}`
}

export default function TeamCard({ team, index = 0, largest = 1 }) {
  const { name, workspaceName, memberCount, role } = team

  const color = colorFor(workspaceName)
  const share = Math.round((memberCount / largest) * 100)

  return (
    <article
      className="lib-card tms-card dsh-glass dsh-in"
      style={{ '--in': `${index * 55}ms`, '--tint': color }}
      aria-label={`${name} in ${workspaceName}, ${memberLabel(memberCount)}`}
    >
      <div className="lib-card-head">
        <span className="lib-mark" style={{ background: `linear-gradient(145deg, ${color}, ${color}A6)` }}>
          {initial(name)}
        </span>
        <span className="tms-count">
          {memberCount}
          <i>{memberCount === 1 ? 'member' : 'members'}</i>
        </span>
      </div>

      <h4 className="lib-name" title={name}>{name}</h4>
      <span className="dsh-chip lib-ws-chip">
        <i style={{ background: color }} aria-hidden="true" />
        {workspaceName}
      </span>

      <div className="lib-card-foot tms-foot">
        {/* Rests at its true width and only animates in, so the meter is
            never wrong if the animation is skipped or never starts. */}
        <div className="dsh-bar tms-meter" title={`${memberLabel(memberCount)} — largest team here has ${largest}`}>
          <i style={{ '--c': color, '--w': `${share}%`, '--md': `${260 + index * 55}ms` }} />
        </div>
        <span className="lib-meta">{role.toLowerCase()}</span>
      </div>
    </article>
  )
}
