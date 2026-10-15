import React, { useCallback, useId, useRef, useState } from 'react'
import Avatar from '../Avatar'
import { PlusIcon } from '../shell/icons'
import { useDismiss } from '../../hooks/useDismiss'

/**
 * Who is on this board's team, in the header.
 *
 * A stack of avatars (with a +N chip past the limit) that opens a list
 * of everyone with their email, and — when the caller may manage the
 * team — an "Add people" button beside it. The list closes on Escape or
 * a click elsewhere.
 */
const MAX_AVATARS = 4
const AVATAR_SIZE = 22

export default function BoardMembers({ teamName, members = [], onAddPeople }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const listId = useId()
  const close = useCallback(() => setOpen(false), [])
  useDismiss(rootRef, open, close)

  const shown = members.slice(0, MAX_AVATARS)
  const overflow = members.length - shown.length
  const noun = members.length === 1 ? 'member' : 'members'

  return (
    <div className="brd-members" ref={rootRef}>
      <button
        type="button"
        className="brd-members-btn"
        aria-label={`${teamName} team, ${members.length} ${noun}`}
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen(o => !o)}
      >
        <span className="ui-avatars">
          {shown.map(m => <Avatar key={m.userId ?? m.name} name={m.name} size={AVATAR_SIZE} decorative />)}
          {overflow > 0 && (
            <span className="ui-avatar is-more" style={{ '--size': `${AVATAR_SIZE}px` }} aria-hidden="true">
              +{overflow}
            </span>
          )}
        </span>
      </button>

      {open && (
        <div className="ui-menu brd-members-pop" id={listId}>
          <div className="ui-menu-label">{teamName}</div>
          {members.length === 0 ? (
            <p className="brd-members-empty">No members yet.</p>
          ) : (
            <ul className="brd-members-list">
              {members.map(m => (
                <li key={m.userId ?? m.name} className="brd-members-item">
                  <Avatar name={m.name} size={AVATAR_SIZE} decorative />
                  <span className="brd-members-text">
                    <span className="brd-members-name">{m.name}</span>
                    {m.email && <span className="brd-members-email">{m.email}</span>}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {onAddPeople && (
        <button type="button" className="ui-btn is-ghost" onClick={onAddPeople}>
          <PlusIcon size={12} />
          <span>Add people</span>
        </button>
      )}
    </div>
  )
}
