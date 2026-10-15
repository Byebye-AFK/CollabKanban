import React, { useEffect, useMemo, useRef, useState } from 'react'
import Modal from '../ui/Modal'
import Avatar from '../Avatar'
import { availableMembers } from '../../api/teamsApi'
import './teams.css'

/**
 * Pick people from the team's workspace and add them to the team.
 *
 * `onSubmit(userIds)` resolves to `{added, failed}`. A partial failure
 * keeps the dialog open with only the failed people still selected, so
 * a retry is one click and nobody is added twice.
 */
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
    <Modal
      title={`Add members to ${team.name}`}
      kicker={team.workspaceName}
      onClose={onClose}
      footer={
        <>
          <button className="ui-btn is-ghost" onClick={onClose}>Cancel</button>
          <button
            className="ui-btn is-primary"
            onClick={handleSubmit}
            disabled={selected.size === 0 || submitting}
          >
            {submitLabel(selected.size, submitting)}
          </button>
        </>
      }
    >
      {candidates.length === 0 ? (
        <p className="tms-empty">
          Everyone in {team.workspaceName} is already on {team.name}.
        </p>
      ) : (
        <>
          <input
            ref={searchRef}
            type="search"
            className="ui-input"
            placeholder="Search people…"
            aria-label="Filter people"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <ul className="tms-people">
            {visible.map(person => (
              <li key={person.userId}>
                <label className={`tms-person${selected.has(person.userId) ? ' is-on' : ''}`}>
                  <input
                    type="checkbox"
                    checked={selected.has(person.userId)}
                    onChange={() => toggle(person.userId)}
                  />
                  <Avatar name={person.name} size={24} decorative />
                  <span className="tms-person-text">
                    <span className="tms-person-name">{person.name}</span>
                    {person.email && <span className="tms-person-email">{person.email}</span>}
                  </span>
                </label>
              </li>
            ))}
            {visible.length === 0 && (
              <li className="tms-empty">No one matches “{query.trim()}”.</li>
            )}
          </ul>
        </>
      )}

      {errors.length > 0 && (
        <div className="ui-error" role="alert">
          {errors.map(message => <div key={message}>{message}</div>)}
        </div>
      )}
    </Modal>
  )
}
