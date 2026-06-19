import React, { useState } from 'react'
import BoardPage from './pages/BoardPage'

const css = {
  app: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: 'var(--bg-base)',
    overflow: 'hidden',
  },
  topbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    height: 52,
    background: 'var(--bg-base)',
    borderBottom: '1px solid var(--border)',
    flexShrink: 0,
    zIndex: 20,
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 9,
    fontWeight: 700,
    fontSize: 15,
    color: 'var(--text-primary)',
    letterSpacing: '-0.02em',
    userSelect: 'none',
  },
  logoIcon: {
    width: 26,
    height: 26,
    background: 'var(--accent)',
    borderRadius: 7,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 13,
  },
  boardSelector: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  boardLabel: {
    fontSize: 12,
    color: 'var(--text-muted)',
    fontWeight: 500,
  },
  boardInput: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 7,
    color: 'var(--text-primary)',
    fontSize: 13,
    fontWeight: 500,
    padding: '5px 10px',
    width: 70,
    outline: 'none',
    textAlign: 'center',
  },
  loadBtn: (active) => ({
    padding: '5px 13px',
    borderRadius: 7,
    background: active ? 'var(--accent)' : 'var(--accent-light)',
    color: active ? '#fff' : 'var(--accent)',
    fontSize: 13,
    fontWeight: 600,
    cursor: active ? 'pointer' : 'not-allowed',
    border: 'none',
    transition: 'background var(--transition-fast)',
  }),
  main: {
    flex: 1,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  landing: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    gap: 16,
    padding: 40,
    textAlign: 'center',
  },
  landingTitle: {
    fontSize: 28,
    fontWeight: 700,
    color: 'var(--text-primary)',
    letterSpacing: '-0.03em',
    lineHeight: 1.2,
  },
  landingAccent: {
    color: 'var(--accent)',
  },
  landingDesc: {
    fontSize: 15,
    color: 'var(--text-muted)',
    maxWidth: 360,
    lineHeight: 1.6,
  },
  landingRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  landingInput: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-input)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-primary)',
    fontSize: 14,
    padding: '9px 14px',
    width: 110,
    outline: 'none',
    textAlign: 'center',
    transition: 'border-color var(--transition-fast)',
  },
  landingBtn: {
    padding: '9px 20px',
    borderRadius: 'var(--radius-sm)',
    background: 'var(--accent)',
    color: '#fff',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    border: 'none',
    transition: 'background var(--transition-fast)',
  },
}

export default function App() {
  // The board to display (null = landing screen)
  const [activeBoardId, setActiveBoardId] = useState(null)
  // Input value in the topbar selector
  const [inputId, setInputId] = useState('1')
  // Landing input
  const [landingInput, setLandingInput] = useState('1')

  const load = (id) => {
    const parsed = parseInt(id, 10)
    if (!isNaN(parsed) && parsed > 0) setActiveBoardId(parsed)
  }

  return (
    <div style={css.app}>
      {/* ── Global Top Bar ── */}
      <header style={css.topbar}>
        <div style={css.logo}>
          <div style={css.logoIcon}>⊞</div>
          Kanban
        </div>

        {activeBoardId && (
          <div style={css.boardSelector}>
            <span style={css.boardLabel}>Board ID</span>
            <input
              style={css.boardInput}
              type="number"
              value={inputId}
              min="1"
              onChange={e => setInputId(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') load(inputId) }}
              onFocus={e => e.target.style.borderColor = 'var(--border-focus)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
              aria-label="Board ID"
            />
            <button
              style={css.loadBtn(!!inputId)}
              onClick={() => load(inputId)}
              onMouseEnter={e => { if (inputId) e.currentTarget.style.background = 'var(--accent-hover)' }}
              onMouseLeave={e => { if (inputId) e.currentTarget.style.background = 'var(--accent)' }}
            >
              Load
            </button>
          </div>
        )}
      </header>

      {/* ── Main Content ── */}
      <main style={css.main}>
        {activeBoardId ? (
          <BoardPage boardId={activeBoardId} />
        ) : (
          /* Landing screen */
          <div style={css.landing}>
            <div style={css.landingTitle}>
              Your work,<br />
              <span style={css.landingAccent}>beautifully organised.</span>
            </div>
            <p style={css.landingDesc}>
              Enter your board ID to open a board from your Spring Boot backend.
            </p>
            <div style={css.landingRow}>
              <input
                style={css.landingInput}
                type="number"
                value={landingInput}
                min="1"
                placeholder="Board ID"
                onChange={e => setLandingInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { load(landingInput); setInputId(landingInput) } }}
                onFocus={e => e.target.style.borderColor = 'var(--border-focus)'}
                onBlur={e => e.target.style.borderColor = 'var(--border-input)'}
                aria-label="Board ID"
                autoFocus
              />
              <button
                style={css.landingBtn}
                onClick={() => { load(landingInput); setInputId(landingInput) }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--accent)'}
              >
                Open board →
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
