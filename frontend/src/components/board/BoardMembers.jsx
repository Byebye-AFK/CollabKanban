import React, { useEffect, useId, useRef, useState } from 'react'
import { colorFor, initials } from '../shell/palette'

/**
 * Who is on this board's team, in the top bar.
 *
 * A stack of avatars (with a +N chip past the limit) that opens a list
 * of everyone with their email, and — when the caller may manage the
 * team — an "Add people" button beside it. The list closes on Escape or
 * a click elsewhere.
 */
const MAX_AVATARS = 4

const PlusIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
    <path d="M12 5v14M5 12h14" />
  </svg>
)

function Avatar({ name }) {
  return (
    <span className="brd-avatar" style={{ '--c': colorFor(name) }} aria-hidden="true">
      {initials(name)}
    </span>
  )
}

export default function BoardMembers({ teamName, members = [], onAddPeople }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const listId = useId()

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    const onPointer = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onPointer)
    }
  }, [open])

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
        <span className="brd-avatars">
          {shown.map(m => <Avatar key={m.userId ?? m.name} name={m.name} />)}
          {overflow > 0 && <span className="brd-avatar brd-avatar-more" aria-hidden="true">+{overflow}</span>}
        </span>
      </button>

      {open && (
        <div className="brd-members-pop brd-glass" id={listId}>
          <div className="brd-members-head">{teamName}</div>
          {members.length === 0 ? (
            <p className="brd-members-empty">No members yet.</p>
          ) : (
            <ul className="brd-members-list">
              {members.map(m => (
                <li key={m.userId ?? m.name} className="brd-members-item">
                  <Avatar name={m.name} />
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
        <button type="button" className="brd-btn-ghost" onClick={onAddPeople}>
          <PlusIcon />
          <span className="brd-btn-label">Add people</span>
        </button>
      )}
    </div>
  )
}
