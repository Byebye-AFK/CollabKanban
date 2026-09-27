import React, { useEffect, useMemo, useRef, useState } from 'react'
import { availableMembers } from '../../api/teamsApi'
import { colorFor } from '../shell/palette'

/**
 * Pick people from the team's workspace and add them to the team.
 *
 * Rendered in place rather than through the board's GlassModal: that
 * dialog reads its tokens from `.brd`, which does not exist on the
 * Teams page. Here it sits inside `.dash` and inherits the shell's.
 *
 * `onSubmit(userIds)` resolves to `{added, failed}`. A partial failure
 * keeps the dialog open with only the failed people still selected, so
 * a retry is one click and nobody is added twice.
 */
function initials(name = '') {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('')
}

function submitLabel(count, submitting) {
  if (submitting) return 'Adding…'
  if (count === 0) return 'Add members'
  return `Add ${count} member${count === 1 ? '' : 's'}`
}

export default function AddTeamMembersModal({ team, onSubmit, onClose }) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(() => new Set())
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState([])
  // The `team` prop predates this dialog's own additions; hide those
  // people so a retry after a partial failure cannot re-add them.
  const [justAdded, setJustAdded] = useState(() => new Set())
  const searchRef = useRef(null)

  const candidates = useMemo(
    () => availableMembers(team).filter(p => !justAdded.has(p.userId)),
    [team, justAdded],
  )

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return candidates
    return candidates.filter(p => `${p.name} ${p.email || ''}`.toLowerCase().includes(q))
  }, [candidates, query])

  useEffect(() => { searchRef.current?.focus() }, [])

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const toggle = (userId) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(userId)) next.delete(userId)
      else next.add(userId)
      return next
    })
  }

  const handleSubmit = async () => {
    if (selected.size === 0 || submitting) return
    setSubmitting(true)
    setErrors([])
    // Submitted in list order, so the server sees the same order the user did.
    const ids = candidates.filter(p => selected.has(p.userId)).map(p => p.userId)
    try {
      const { added, failed } = await onSubmit(ids)
      if (failed.length === 0) return onClose()
      setJustAdded(prev => new Set([...prev, ...added]))
      setSelected(new Set(failed.map(f => f.userId)))
      setErrors(failed.map(f => f.message))
    } catch (err) {
      setErrors([err.message || 'Could not add members.'])
    }
    setSubmitting(false)
  }

  return (
    <div
      className="tms-overlay"
      role="presentation"
      onMouseDown={e => { if (e.target === e.currentTarget) onClose?.() }}
    >
      <div className="tms-modal" role="dialog" aria-modal="true" aria-label={`Add members to ${team.name}`}>
        <header className="tms-modal-head">
          <div>
            <span className="tms-modal-kicker">{team.workspaceName}</span>
            <h2 className="tms-modal-title">Add members to {team.name}</h2>
          </div>
          <button className="tms-modal-x" onClick={onClose} aria-label="Close dialog">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </header>

        {candidates.length === 0 ? (
          <p className="tms-modal-empty">
            Everyone in {team.workspaceName} is already on {team.name}.
          </p>
        ) : (
          <>
            <input
              ref={searchRef}
              type="search"
              className="tms-modal-search"
              placeholder="Search people…"
              aria-label="Filter people"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            <ul className="tms-people">
              {visible.map(person => (
                <li key={person.userId}>
                  <label className="tms-person">
                    <input
                      type="checkbox"
                      checked={selected.has(person.userId)}
                      onChange={() => toggle(person.userId)}
                    />
                    <span className="tms-avatar" style={{ '--c': colorFor(person.name) }} aria-hidden="true">
                      {initials(person.name)}
                    </span>
                    <span className="tms-person-text">
                      <span className="tms-person-name">{person.name}</span>
                      {person.email && <span className="tms-person-email">{person.email}</span>}
                    </span>
                  </label>
                </li>
              ))}
              {visible.length === 0 && (
                <li className="tms-modal-empty">No one matches “{query.trim()}”.</li>
              )}
            </ul>
          </>
        )}

        {errors.length > 0 && (
          <div className="tms-modal-error" role="alert">
            {errors.map(message => <div key={message}>{message}</div>)}
          </div>
        )}

        <footer className="tms-modal-foot">
          <button className="tms-btn-ghost" onClick={onClose}>Cancel</button>
          <button
            className="tms-btn"
            onClick={handleSubmit}
            disabled={selected.size === 0 || submitting}
          >
            {submitLabel(selected.size, submitting)}
          </button>
        </footer>
      </div>
    </div>
  )
}
