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
  maxWidth: 380,
  boxShadow: 'var(--shadow-modal)',
  animation: 'slideUp 200ms ease',
}

const SUGGESTIONS = ['Backlog', 'In Progress', 'Review', 'Testing', 'Blocked', 'Staging', 'Done']

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
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    marginBottom: 14,
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
  },
  suggestions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 22,
  },
  chip: (active) => ({
    padding: '4px 10px',
    borderRadius: 99,
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background var(--transition-fast), color var(--transition-fast)',
    background: active ? 'var(--accent-light)' : 'rgba(255,255,255,0.05)',
    color: active ? 'var(--accent)' : 'var(--text-secondary)',
    border: `1px solid ${active ? 'rgba(124,111,247,0.3)' : 'transparent'}`,
    userSelect: 'none',
  }),
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
  errorText: {
    fontSize: 12,
    color: 'var(--danger)',
    marginBottom: 12,
  },
}

export default function CreateColumnModal({ onSubmit, onClose }) {
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const handleSubmit = async () => {
    if (!name.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      await onSubmit(name.trim())
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to create column.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={overlayStyle} onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div style={modalStyle} onKeyDown={e => { if (e.key === 'Enter') handleSubmit() }}>
        <div style={css.header}>
          <div style={css.title}>New column</div>
          <button
            style={css.closeBtn}
            onClick={onClose}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div style={css.field}>
          <label style={css.label}>Column name *</label>
          <input
            ref={inputRef}
            style={css.input}
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. In Review"
            maxLength={80}
            onFocus={e => e.target.style.borderColor = 'var(--border-focus)'}
            onBlur={e => e.target.style.borderColor = 'var(--border-input)'}
          />
        </div>

        <div style={css.suggestions}>
          {SUGGESTIONS.map(s => (
            <span
              key={s}
              style={css.chip(name === s)}
              onClick={() => setName(s)}
            >
              {s}
            </span>
          ))}
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
            style={css.submitBtn(!name.trim() || submitting)}
            onClick={handleSubmit}
            disabled={!name.trim() || submitting}
            onMouseEnter={e => { if (name.trim() && !submitting) e.currentTarget.style.background = 'var(--accent-hover)' }}
            onMouseLeave={e => { if (name.trim() && !submitting) e.currentTarget.style.background = 'var(--accent)' }}
          >
            {submitting ? 'Creating…' : 'Create column'}
          </button>
        </div>
      </div>
    </div>
  )
}
