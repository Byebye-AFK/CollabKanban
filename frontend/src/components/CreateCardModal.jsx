import React, { useState, useEffect, useRef } from 'react'

const overlayStyle = {
  position: 'fixed',
  inset: 0,
  background: 'var(--bg-overlay)',
  backdropFilter: 'blur(4px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: 20,
}

const modalStyle = {
  background: 'var(--bg-modal)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-xl)',
  padding: '28px 28px 24px',
  width: '100%',
  maxWidth: 440,
  boxShadow: 'var(--shadow-modal)',
  animation: 'slideUp 200ms ease',
}

const css = {
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
  },
  title: {
    fontSize: 16,
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 7,
    background: 'transparent',
    color: 'var(--text-muted)',
    fontSize: 18,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'background var(--transition-fast)',
    lineHeight: 1,
  },
  fieldset: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
    marginBottom: 22,
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: 500,
    color: 'var(--text-secondary)',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  },
  input: {
    background: 'var(--bg-input)',
    border: '1px solid var(--border-input)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-primary)',
    fontSize: 14,
    padding: '9px 12px',
    outline: 'none',
    transition: 'border-color var(--transition-fast)',
    width: '100%',
    lineHeight: 1.5,
  },
  textarea: {
    background: 'var(--bg-input)',
    border: '1px solid var(--border-input)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-primary)',
    fontSize: 14,
    padding: '9px 12px',
    outline: 'none',
    resize: 'vertical',
    minHeight: 80,
    transition: 'border-color var(--transition-fast)',
    width: '100%',
    lineHeight: 1.5,
    fontFamily: 'inherit',
  },
  footer: {
    display: 'flex',
    gap: 10,
    justifyContent: 'flex-end',
  },
  cancelBtn: {
    padding: '8px 16px',
    borderRadius: 'var(--radius-sm)',
    background: 'transparent',
    border: '1px solid var(--border-input)',
    color: 'var(--text-secondary)',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background var(--transition-fast)',
  },
  submitBtn: (disabled) => ({
    padding: '8px 18px',
    borderRadius: 'var(--radius-sm)',
    background: disabled ? 'var(--accent-light)' : 'var(--accent)',
    color: disabled ? 'var(--text-muted)' : '#fff',
    fontSize: 14,
    fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'background var(--transition-fast)',
    border: 'none',
  }),
  columnBadge: (color) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 12,
    color: 'var(--text-secondary)',
    marginBottom: 4,
  }),
  dot: (color) => ({
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: color,
    flexShrink: 0,
  }),
  errorText: {
    fontSize: 12,
    color: 'var(--danger)',
    marginTop: 4,
  },
}

export default function CreateCardModal({ columnId, columnName, columnColor, onSubmit, onClose }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const titleRef = useRef(null)

  useEffect(() => {
    titleRef.current?.focus()
  }, [])

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const handleSubmit = async () => {
    if (!title.trim()) return
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
    } finally {
      setSubmitting(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit()
  }

  return (
    <div style={overlayStyle} onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div style={modalStyle} onKeyDown={handleKeyDown}>
        <div style={css.header}>
          <div>
            <div style={css.columnBadge(columnColor)}>
              <div style={css.dot(columnColor)} />
              {columnName}
            </div>
            <div style={css.title}>Add card</div>
          </div>
          <button
            style={css.closeBtn}
            onClick={onClose}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        <div style={css.fieldset}>
          <div style={css.field}>
            <label style={css.label}>Title *</label>
            <input
              ref={titleRef}
              style={css.input}
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              maxLength={200}
              onFocus={e => e.target.style.borderColor = 'var(--border-focus)'}
              onBlur={e => e.target.style.borderColor = 'var(--border-input)'}
            />
          </div>

          <div style={css.field}>
            <label style={css.label}>Description</label>
            <textarea
              style={css.textarea}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Add more context…"
              maxLength={2000}
              onFocus={e => e.target.style.borderColor = 'var(--border-focus)'}
              onBlur={e => e.target.style.borderColor = 'var(--border-input)'}
            />
          </div>

          <div style={css.field}>
            <label style={css.label}>Assign to (User ID)</label>
            <input
              style={css.input}
              type="number"
              value={assignedTo}
              onChange={e => setAssignedTo(e.target.value)}
              placeholder="e.g. 5"
              min="1"
              onFocus={e => e.target.style.borderColor = 'var(--border-focus)'}
              onBlur={e => e.target.style.borderColor = 'var(--border-input)'}
            />
          </div>
        </div>

        {error && <div style={css.errorText}>{error}</div>}

        <div style={css.footer}>
          <button
            style={css.cancelBtn}
            onClick={onClose}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            Cancel
          </button>
          <button
            style={css.submitBtn(!title.trim() || submitting)}
            onClick={handleSubmit}
            disabled={!title.trim() || submitting}
            onMouseEnter={e => { if (title.trim() && !submitting) e.currentTarget.style.background = 'var(--accent-hover)' }}
            onMouseLeave={e => { if (title.trim() && !submitting) e.currentTarget.style.background = 'var(--accent)' }}
          >
            {submitting ? 'Adding…' : 'Add card'}
          </button>
        </div>
      </div>
    </div>
  )
}
