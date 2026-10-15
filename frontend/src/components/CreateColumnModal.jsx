import React, { useEffect, useRef, useState } from 'react'
import Modal from './ui/Modal'
import { StatusIcon } from './shell/icons'
import { columnStatus } from '../api/boardStatus'

/**
 * Suggested names, one per status, so a new board picks up the right
 * status icons and its Active / Backlog views work from the start.
 */
const SUGGESTIONS = ['Backlog', 'Todo', 'In Progress', 'In Review', 'Done', 'Canceled']

export default function CreateColumnModal({ onSubmit, onClose }) {
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const inputRef = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const handleSubmit = async () => {
    if (!name.trim() || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      await onSubmit(name.trim())
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to create column.')
      setSubmitting(false)
    }
  }

  const disabled = !name.trim() || submitting

  return (
    <Modal
      title="New column"
      onClose={onClose}
      footer={
        <>
          <span className="ui-hint">↵ to create</span>
          <button className="ui-btn is-ghost" onClick={onClose}>Cancel</button>
          <button className="ui-btn is-primary" onClick={handleSubmit} disabled={disabled}>
            {submitting ? 'Creating…' : 'Create column'}
          </button>
        </>
      }
    >
      <div className="ui-field">
        <label className="ui-label" htmlFor="column-name">Column name</label>
        <input
          id="column-name"
          ref={inputRef}
          className="ui-input"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSubmit() }}
          placeholder="e.g. In Review"
          maxLength={80}
        />
      </div>

      <div className="brd-suggest">
        {SUGGESTIONS.map(s => (
          <button
            key={s}
            type="button"
            className={`ui-chip${name === s ? ' is-on' : ''}`}
            onClick={() => setName(s)}
          >
            <StatusIcon status={columnStatus(s)} size={12} />
            {s}
          </button>
        ))}
      </div>

      {error && <div className="ui-error" role="alert">{error}</div>}
    </Modal>
  )
}
