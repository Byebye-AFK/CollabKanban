import React, { useEffect, useRef, useState } from 'react'
import GlassModal from './board/GlassModal'

export default function CreateCardModal({
  columnId,
  columnName,
  columnColor,
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
    <GlassModal
      title="Add card"
      onClose={onClose}
      badge={
        <span className="brd-modal-badge" style={{ '--c': columnColor }}>
          <i aria-hidden="true" />
          {columnName}
        </span>
      }
      footer={
        <>
          <span className="brd-hint">⌘↵ to add</span>
          <button className="brd-btn-ghost" onClick={onClose}>Cancel</button>
          <button className="brd-btn" onClick={handleSubmit} disabled={disabled}>
            {submitting ? 'Adding…' : 'Add card'}
          </button>
        </>
      }
    >
      <div onKeyDown={handleKeyDown} style={{ display: 'contents' }}>
        <div className="brd-field">
          <label className="brd-label" htmlFor="brd-card-title">Title</label>
          <input
            id="brd-card-title"
            ref={titleRef}
            className="brd-input"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="What needs to be done?"
            maxLength={200}
          />
        </div>

        <div className="brd-field">
          <label className="brd-label" htmlFor="brd-card-desc">Description</label>
          <textarea
            id="brd-card-desc"
            className="brd-textarea"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Add more context…"
            maxLength={2000}
          />
        </div>

        <div className="brd-field">
          <label className="brd-label" htmlFor="brd-card-assignee">Assign to (user ID)</label>
          <input
            id="brd-card-assignee"
            className="brd-input"
            type="number"
            min="1"
            value={assignedTo}
            onChange={e => setAssignedTo(e.target.value)}
            placeholder="e.g. 5"
          />
        </div>
      </div>

      {error && <div className="brd-error">{error}</div>}
    </GlassModal>
  )
}
