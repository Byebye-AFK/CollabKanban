import React, { useEffect, useRef, useState } from 'react'
import { login, signUp, signInWithGoogle } from '../api/authApi'
import './LoginModal.css'

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
    <div className="lm-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="lm-card" onKeyDown={handleKeyDown}>
        <div className="lm-header">
          <div className="lm-title">{mode === 'login' ? 'Welcome back' : 'Create your account'}</div>
          <button className="lm-close" onClick={onClose} aria-label="Close modal">×</button>
        </div>
        <div className="lm-subtitle">
          {mode === 'login' ? 'Sign in to access your boards.' : 'Start organizing your work in minutes.'}
        </div>

        <button className="lm-google" onClick={signInWithGoogle}>
          <svg width="16" height="16" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84c-.21 1.13-.84 2.09-1.8 2.73v2.27h2.91c1.7-1.57 2.69-3.88 2.69-6.64z" />
            <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.27c-.81.54-1.84.86-3.05.86-2.35 0-4.34-1.58-5.05-3.71H.96v2.34C2.44 15.98 5.48 18 9 18z" />
            <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 013.68 9c0-.59.1-1.17.27-1.7V4.96H.96A9 9 0 000 9c0 1.45.35 2.83.96 4.04l2.99-2.34z" />
            <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0 5.48 0 2.44 2.02.96 4.96l2.99 2.34C4.66 5.16 6.65 3.58 9 3.58z" />
          </svg>
          Continue with Google
        </button>

        <div className="lm-divider">or</div>

        <div className="lm-fieldset">
          {mode === 'signup' && (
            <div className="lm-field">
              <label className="lm-label">Name</label>
              <input
                className="lm-input"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Jane Doe"
              />
            </div>
          )}
          <div className="lm-field">
            <label className="lm-label">Email</label>
            <input
              ref={emailRef}
              className="lm-input"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div className="lm-field">
            <label className="lm-label">Password</label>
            <input
              className="lm-input"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
        </div>

        {error && <div className="lm-error">{error}</div>}

        <button className="lm-submit" onClick={handleSubmit} disabled={!valid || submitting}>
          {submitting ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
        </button>

        <div className="lm-switch">
          {mode === 'login' ? (
            <>Don't have an account? <button className="lm-switch-link" onClick={() => { setMode('signup'); setError(null) }}>Sign up</button></>
          ) : (
            <>Already have an account? <button className="lm-switch-link" onClick={() => { setMode('login'); setError(null) }}>Sign in</button></>
          )}
        </div>
      </div>
    </div>
  )
}
