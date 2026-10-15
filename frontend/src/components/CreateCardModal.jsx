import React, { useEffect, useRef, useState } from 'react'
import Modal from './ui/Modal'
import { StatusIcon } from './shell/icons'

/**
 * New card, after Linear's "New issue": the title as a heading-sized
 * field, the description as a bare text area, and the column it lands
 * in named at the top.
 */
export default function CreateCardModal({
  columnId,
  columnName,
  status,
  onSubmit,
  onClose,
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const titleRef = useRef(null)

  useEffect(() => { titleRef.current?.focus() }, [])

  const handleSubmit = async () => {
    if (!title.trim() || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        columnId,
        assignedTo: assignedTo ? Number(assignedTo) : undefined,
      })
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to create card.')
      setSubmitting(false)
    }
  }

  // ⌘/Ctrl-Enter submits from anywhere in the form, including the
  // textarea where a bare Enter has to stay a newline.
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit()
  }

  const disabled = !title.trim() || submitting

  return (
    <Modal
      title="New card"
      kicker={<><StatusIcon status={status} size={12} />{columnName}</>}
      onClose={onClose}
      footer={
        <>
          <span className="ui-hint">⌘↵ to create</span>
          <button className="ui-btn is-ghost" onClick={onClose}>Cancel</button>
          <button className="ui-btn is-primary" onClick={handleSubmit} disabled={disabled}>
            {submitting ? 'Creating…' : 'Create card'}
          </button>
        </>
      }
    >
      <div onKeyDown={handleKeyDown} style={{ display: 'contents' }}>
        <input
          ref={titleRef}
          className="ui-input is-bare"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Card title"
          aria-label="Title"
          maxLength={200}
        />

        <textarea
          className="ui-textarea is-bare"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Add description…"
          aria-label="Description"
          maxLength={2000}
        />

        <div className="ui-field">
          <label className="ui-label" htmlFor="card-assignee">Assign to (user ID)</label>
          <input
            id="card-assignee"
            className="ui-input"
            type="number"
            min="1"
            value={assignedTo}
            onChange={e => setAssignedTo(e.target.value)}
            placeholder="e.g. 5"
          />
        </div>
      </div>

      {error && <div className="ui-error" role="alert">{error}</div>}
    </Modal>
  )
}
