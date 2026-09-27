import React, { useEffect, useRef, useState } from 'react'

/**
 * Name a new team and pick the workspace it lives in.
 *
 * Shares the `.tms-modal` shell with AddTeamMembersModal for the same
 * reason: it renders inside `.dash` and inherits the shell's tokens.
 *
 * `workspaces` is already narrowed to the ones the user may create in
 * (see teamHomes). `onSubmit({name, workspaceId})` resolves on success
 * and rejects with a user-facing message, which keeps the dialog open.
 */
export default function CreateTeamModal({ workspaces, initialWorkspaceId, onSubmit, onClose }) {
  const [name, setName] = useState('')
  const [workspaceId, setWorkspaceId] = useState(
    () => initialWorkspaceId ?? workspaces[0]?.workspaceId,
  )
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const nameRef = useRef(null)

  const canSubmit = name.trim().length > 0 && workspaceId != null && !submitting

  useEffect(() => { nameRef.current?.focus() }, [])

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    try {
      await onSubmit({ name: name.trim(), workspaceId })
      onClose()
    } catch (err) {
      setError(err.message || 'Could not create the team.')
      setSubmitting(false)
    }
  }

  return (
    <div
      className="tms-overlay"
      role="presentation"
      onMouseDown={e => { if (e.target === e.currentTarget) onClose?.() }}
    >
      <form className="tms-modal" role="dialog" aria-modal="true" aria-label="Create a team" onSubmit={handleSubmit}>
        <header className="tms-modal-head">
          <div>
            <span className="tms-modal-kicker">Teams</span>
            <h2 className="tms-modal-title">Create a team</h2>
          </div>
          <button type="button" className="tms-modal-x" onClick={onClose} aria-label="Close dialog">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </header>

        <label className="tms-field">
          <span className="tms-field-label">Team name</span>
          <input
            ref={nameRef}
            className="tms-modal-search"
            placeholder="e.g. Design"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </label>

        <label className="tms-field">
          <span className="tms-field-label">Workspace</span>
          <select
            className="tms-modal-search tms-select"
            value={workspaceId ?? ''}
            onChange={e => setWorkspaceId(Number(e.target.value))}
          >
            {workspaces.map(w => (
              <option key={w.workspaceId} value={w.workspaceId}>{w.name}</option>
            ))}
          </select>
        </label>

        {error && <div className="tms-modal-error" role="alert">{error}</div>}

        <footer className="tms-modal-foot">
          <button type="button" className="tms-btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="tms-btn" disabled={!canSubmit}>
            {submitting ? 'Creating…' : 'Create team'}
          </button>
        </footer>
      </form>
    </div>
  )
}
