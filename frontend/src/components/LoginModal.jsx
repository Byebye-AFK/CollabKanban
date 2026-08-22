import React, { useEffect, useRef, useState } from 'react'
import { login, signUp, signInWithGoogle } from '../api/authApi'

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

const css = {
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
    color: 'var(--text-primary)',
    letterSpacing: '-0.02em',
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
  subtitle: {
    fontSize: 13,
    color: 'var(--text-muted)',
    marginBottom: 22,
  },
  googleBtn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: '10px 14px',
    borderRadius: 'var(--radius-sm)',
    background: 'var(--bg-card)',
    border: '1px solid var(--border-input)',
    color: 'var(--text-primary)',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background var(--transition-fast)',
    marginBottom: 18,
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    color: 'var(--text-muted)',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: 18,
  },
  dividerLine: { flex: 1, height: 1, background: 'var(--border)' },
  fieldset: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
    marginBottom: 20,
  },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
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
  submitBtn: (disabled) => ({
    width: '100%',
    padding: '10px 18px',
    borderRadius: 'var(--radius-sm)',
    background: disabled ? 'var(--accent-light)' : 'var(--accent)',
    color: disabled ? 'var(--text-muted)' : '#fff',
    fontSize: 14,
    fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'background var(--transition-fast)',
    border: 'none',
  }),
  switchRow: {
    marginTop: 16,
    textAlign: 'center',
    fontSize: 13,
    color: 'var(--text-muted)',
  },
  switchLink: {
    color: 'var(--accent)',
    fontWeight: 600,
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    fontSize: 13,
    padding: 0,
  },
  errorText: {
    fontSize: 12,
    color: 'var(--danger)',
    marginBottom: 14,
  },
}

export default function LoginModal({ onClose, onLogin }) {
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const emailRef = useRef(null)

  useEffect(() => { emailRef.current?.focus() }, [mode])

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const valid = email.trim() && password.trim() && (mode === 'login' || name.trim())

  const handleSubmit = async () => {
    if (!valid) return
    setSubmitting(true)
    setError(null)
    try {
      const user = mode === 'login'
        ? await login(email.trim(), password)
        : await signUp(name.trim(), email.trim(), password)
      onLogin(user)
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleKeyDown = (e) => { if (e.key === 'Enter') handleSubmit() }

  return (
    <div style={overlayStyle} onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div style={modalStyle} onKeyDown={handleKeyDown}>
        <div style={css.header}>
          <div style={css.title}>{mode === 'login' ? 'Welcome back' : 'Create your account'}</div>
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
        <div style={css.subtitle}>
          {mode === 'login' ? 'Sign in to access your boards.' : 'Start organizing your work in minutes.'}
        </div>

        <button
          style={css.googleBtn}
          onClick={signInWithGoogle}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-card)'}
        >
          <svg width="16" height="16" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84c-.21 1.13-.84 2.09-1.8 2.73v2.27h2.91c1.7-1.57 2.69-3.88 2.69-6.64z" />
            <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.27c-.81.54-1.84.86-3.05.86-2.35 0-4.34-1.58-5.05-3.71H.96v2.34C2.44 15.98 5.48 18 9 18z" />
            <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 013.68 9c0-.59.1-1.17.27-1.7V4.96H.96A9 9 0 000 9c0 1.45.35 2.83.96 4.04l2.99-2.34z" />
            <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0 5.48 0 2.44 2.02.96 4.96l2.99 2.34C4.66 5.16 6.65 3.58 9 3.58z" />
          </svg>
          Continue with Google
        </button>

        <div style={css.divider}>
          <div style={css.dividerLine} />
          or
          <div style={css.dividerLine} />
        </div>

        <div style={css.fieldset}>
          {mode === 'signup' && (
            <div style={css.field}>
              <label style={css.label}>Name</label>
              <input
                style={css.input}
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Jane Doe"
                onFocus={e => e.target.style.borderColor = 'var(--border-focus)'}
                onBlur={e => e.target.style.borderColor = 'var(--border-input)'}
              />
            </div>
          )}
          <div style={css.field}>
            <label style={css.label}>Email</label>
            <input
              ref={emailRef}
              style={css.input}
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              onFocus={e => e.target.style.borderColor = 'var(--border-focus)'}
              onBlur={e => e.target.style.borderColor = 'var(--border-input)'}
            />
          </div>
          <div style={css.field}>
            <label style={css.label}>Password</label>
            <input
              style={css.input}
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              onFocus={e => e.target.style.borderColor = 'var(--border-focus)'}
              onBlur={e => e.target.style.borderColor = 'var(--border-input)'}
            />
          </div>
        </div>

        {error && <div style={css.errorText}>{error}</div>}

        <button
          style={css.submitBtn(!valid || submitting)}
          onClick={handleSubmit}
          disabled={!valid || submitting}
          onMouseEnter={e => { if (valid && !submitting) e.currentTarget.style.background = 'var(--accent-hover)' }}
          onMouseLeave={e => { if (valid && !submitting) e.currentTarget.style.background = 'var(--accent)' }}
        >
          {submitting ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
        </button>

        <div style={css.switchRow}>
          {mode === 'login' ? (
            <>Don't have an account? <button style={css.switchLink} onClick={() => { setMode('signup'); setError(null) }}>Sign up</button></>
          ) : (
            <>Already have an account? <button style={css.switchLink} onClick={() => { setMode('login'); setError(null) }}>Sign in</button></>
          )}
        </div>
      </div>
    </div>
  )
}
