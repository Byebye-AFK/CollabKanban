import React, { useEffect, useRef, useState } from 'react'
import GlassModal from './board/GlassModal'

const SUGGESTIONS = ['To do', 'In progress', 'In review', 'Blocked', 'Done']

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
    <GlassModal
      title="New column"
      onClose={onClose}
      footer={
        <>
          <span className="brd-hint">Enter to create</span>
          <button className="brd-btn-ghost" onClick={onClose}>Cancel</button>
          <button className="brd-btn" onClick={handleSubmit} disabled={disabled}>
            {submitting ? 'Creating…' : 'Create column'}
          </button>
        </>
      }
    >
      <div className="brd-field">
        <label className="brd-label" htmlFor="brd-col-name">Column name</label>
        <input
          id="brd-col-name"
          ref={inputRef}
          className="brd-input"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSubmit() }}
          placeholder="e.g. In review"
          maxLength={80}
        />
      </div>

      <div className="brd-chips">
        {SUGGESTIONS.map(s => (
          <button
            key={s}
            type="button"
            className={`brd-chip${name === s ? ' is-on' : ''}`}
            onClick={() => setName(s)}
          >
            {s}
          </button>
        ))}
      </div>

      {error && <div className="brd-error">{error}</div>}
    </GlassModal>
  )
}
