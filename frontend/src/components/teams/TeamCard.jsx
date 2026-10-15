import React from 'react'
import { colorFor } from '../shell/palette'
import { GLYPHS, Icon, PlusIcon } from '../shell/icons'

/**
 * One team as a list row, sharing the board row's columns so the two
 * libraries read as one system.
 *
 * Where a board shows completion, a team shows its size — a meter scaled
 * against the largest team on the page, so the bars compare teams to
 * each other rather than to an invented ceiling.
 */
const STAGGER_MS = 30

function memberLabel(count) {
  if (count === 0) return 'No members yet'
  return `${count} member${count === 1 ? '' : 's'}`
}

export default function TeamCard({ team, index = 0, largest = 1, onAddMembers }) {
  const { name, workspaceName, memberCount, role } = team

  const color = colorFor(workspaceName)
  const share = Math.round((memberCount / largest) * 100)

  return (
    <article
      className="lib-card tms-card ui-in"
      style={{ '--in': `${index * STAGGER_MS}ms` }}
      aria-label={`${name} in ${workspaceName}, ${memberLabel(memberCount)}`}
    >
      <span className="lib-icon" aria-hidden="true"><Icon paths={GLYPHS.teams} size={15} /></span>

      <h4 className="lib-name" title={name}>{name}</h4>
      <span className="ui-chip lib-ws-chip">
        <i style={{ '--c': color }} aria-hidden="true" />
        {workspaceName}
      </span>

      <span className="tms-count">
        {memberCount}
        <i>{memberCount === 1 ? 'member' : 'members'}</i>
      </span>

      {/* Rests at its true width and only animates in, so the meter is
          never wrong if the animation is skipped or never starts. */}
      <span className="tms-meter" title={`${memberLabel(memberCount)} — largest team here has ${largest}`}>
        <i style={{ '--w': `${share}%`, '--md': `${200 + index * STAGGER_MS}ms` }} />
      </span>

      <span className="lib-meta tms-role">{role.toLowerCase()}</span>

      {/* Only offered when the page has decided this user may manage the
          team — the row itself makes no permission call. */}
      {onAddMembers ? (
        <button
          type="button"
          className="ui-btn is-ghost tms-add"
          onClick={() => onAddMembers(team)}
          aria-label={`Add members to ${name}`}
        >
          <PlusIcon size={12} /> Add
        </button>
      ) : <span className="lib-star-gap" />}
    </article>
  )
}
