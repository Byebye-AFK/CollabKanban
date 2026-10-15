import React, { useEffect, useRef, useState } from 'react'
import Modal from '../ui/Modal'

/**
 * Name a new team and pick the workspace it lives in.
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
    <Modal
      as="form"
      onSubmit={handleSubmit}
      title="Create a team"
      kicker="Teams"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="ui-btn is-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="ui-btn is-primary" disabled={!canSubmit}>
            {submitting ? 'Creating…' : 'Create team'}
          </button>
        </>
      }
    >
      <label className="ui-field">
        <span className="ui-label">Team name</span>
        <input
          ref={nameRef}
          className="ui-input"
          placeholder="e.g. Design"
          value={name}
          onChange={e => setName(e.target.value)}
        />
      </label>

      <label className="ui-field">
        <span className="ui-label">Workspace</span>
        <select
          className="ui-select"
          value={workspaceId ?? ''}
          onChange={e => setWorkspaceId(Number(e.target.value))}
        >
          {workspaces.map(w => (
            <option key={w.workspaceId} value={w.workspaceId}>{w.name}</option>
          ))}
        </select>
      </label>

      {error && <div className="ui-error" role="alert">{error}</div>}
    </Modal>
  )
}
