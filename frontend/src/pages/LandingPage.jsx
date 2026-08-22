import React, { useEffect, useRef } from 'react'
import './LandingPage.css'

/* ══════════════════════════════════════════════════════════════
   Hand-built vector art.
   Everything below is drawn rather than imported so the hero has
   no runtime asset dependencies and stays crisp at any zoom.
   ═════════════════════════════════════════════════════════════ */

/** Push-pin seen head-on: lit sphere, specular highlight, cast shade. */
function Pin() {
  return (
    <svg className="lp-pin" width="26" height="26" viewBox="0 0 26 26">
      <defs>
        <radialGradient id="pinBody" cx="34%" cy="28%" r="78%">
          <stop offset="0%" stopColor="#FF9C8F" />
          <stop offset="38%" stopColor="#E23B2E" />
          <stop offset="100%" stopColor="#8E1810" />
        </radialGradient>
      </defs>
      <circle cx="13" cy="13" r="9" fill="url(#pinBody)" />
      <ellipse cx="9.8" cy="9.4" rx="3" ry="2.2" fill="#fff" opacity=".55"
        transform="rotate(-32 9.8 9.4)" />
      <path d="M13 21.6a9 9 0 0 0 7.4-4.1 9 9 0 0 1-14.8 0A9 9 0 0 0 13 21.6z"
        fill="#5E0D07" opacity=".35" />
    </svg>
  )
}

/** Mechanical stopwatch. 60 real ticks, classic 10:10 pose, sweeping hand. */
function Stopwatch() {
  const cx = 50
  const cy = 55
  return (
    <svg width="94" height="94" viewBox="0 0 100 100">
      <defs>
        <radialGradient id="dial" cx="36%" cy="26%" r="84%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="70%" stopColor="#FAFAFB" />
          <stop offset="100%" stopColor="#EAEBEE" />
        </radialGradient>
        <linearGradient id="bezel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F4F5F7" />
          <stop offset="100%" stopColor="#D9DBDF" />
        </linearGradient>
      </defs>

      {/* crown + side button */}
      <rect x="44" y="4" width="12" height="10" rx="2.8" fill="#34373C" />
      <rect x="46.2" y="1" width="7.6" height="4.4" rx="1.8" fill="#4C5158" />
      <rect x="74.5" y="15" width="9" height="7" rx="2.6" fill="#34373C"
        transform="rotate(44 79 18.5)" />

      {/* case + dial */}
      <circle cx={cx} cy={cy} r="41" fill="url(#bezel)" />
      <circle cx={cx} cy={cy} r="37.5" fill="url(#dial)" />
      <circle cx={cx} cy={cy} r="37.5" fill="none" stroke="#CFD2D6" strokeWidth="1" />

      {/* ticks */}
      {Array.from({ length: 60 }).map((_, i) => {
        const major = i % 5 === 0
        return (
          <line
            key={i}
            x1={cx} y1={cy - 34} x2={cx} y2={cy - (major ? 27 : 30.5)}
            stroke={major ? '#1B1D21' : '#A9AEB4'}
            strokeWidth={major ? 2.6 : 1.1}
            strokeLinecap="round"
            transform={`rotate(${i * 6} ${cx} ${cy})`}
          />
        )
      })}

      {/* hands — classic 10:10 rest pose keeps them from overlapping */}
      <g transform={`rotate(-58 ${cx} ${cy})`}>
        <rect x={cx - 2.2} y={cy - 20} width="4.4" height="23" rx="2.2" fill="#1B1D21" />
      </g>
      <g transform={`rotate(62 ${cx} ${cy})`}>
        <rect x={cx - 1.7} y={cy - 30} width="3.4" height="33" rx="1.7" fill="#1B1D21" />
      </g>
      <g className="lp-second-hand">
        <rect x={cx - 0.75} y={cy - 32} width="1.5" height="39" rx="0.75" fill="#E2372B" />
      </g>
      <circle cx={cx} cy={cy} r="3" fill="#1B1D21" />
      <circle cx={cx} cy={cy} r="1.2" fill="#E2372B" />
    </svg>
  )
}

/** iOS-style completed-task glyph. */
function CheckGlyph({ size = 44 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48">
      <defs>
        <linearGradient id="checkBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4C8DFF" />
          <stop offset="100%" stopColor="#1F63EF" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="13" fill="url(#checkBg)" />
      <path d="M13.5 24.6l7 6.9 14-14.6" fill="none" stroke="#fff"
        strokeWidth="4.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** Illustrated teammate. Cheaper than photography, reads at 24px. */
function Person({ size = 26, bg, skin, hair, shirt, variant = 0, id }) {
  const clip = `avc-${id}`
  return (
    <svg width={size} height={size} viewBox="0 0 40 40">
      <defs>
        <clipPath id={clip}><circle cx="20" cy="20" r="20" /></clipPath>
      </defs>
      <g clipPath={`url(#${clip})`}>
        <rect width="40" height="40" fill={bg} />
        <ellipse cx="20" cy="42" rx="14.5" ry="12.5" fill={shirt} />
        <circle cx="20" cy="17.5" r="9" fill={skin} />
        {variant === 0 && (
          <path d="M11 17a9 9 0 0 1 18 0c0-7-4.2-10.5-9-10.5S11 10 11 17z" fill={hair} />
        )}
        {variant === 1 && (
          <>
            <path d="M10.6 18.5c-.6-8 3.9-12 9.4-12s10 4 9.4 12c-.5-4-1.3-5.6-2.4-6.4-2.6 1.6-11.4 1.9-14 .3-1.2.9-2 2.3-2.4 6.1z" fill={hair} />
            <ellipse cx="11.6" cy="20" rx="1.9" ry="4.2" fill={hair} />
            <ellipse cx="28.4" cy="20" rx="1.9" ry="4.2" fill={hair} />
          </>
        )}
        {variant === 2 && (
          <>
            <path d="M11 17.5c0-7 4-10.5 9-10.5s9 3.5 9 10.5c-1-3.4-2.2-4.8-3.4-5.4-3 1.4-9.2 1.4-11.6-.4-1.4.9-2.3 2.6-3 5.8z" fill={hair} />
            <circle cx="20" cy="6.2" r="3.4" fill={hair} />
          </>
        )}
      </g>
    </svg>
  )
}

const PEOPLE = [
  { bg: '#FBE3BE', skin: '#F0C099', hair: '#8A5A2B', shirt: '#E29A34', variant: 2 },
  { bg: '#DCE8F6', skin: '#EAC0A2', hair: '#BFC3C7', shirt: '#63758F', variant: 1 },
  { bg: '#E6DFF6', skin: '#9A6541', hair: '#241812', shirt: '#454F63', variant: 0 },
  { bg: '#F7DEE1', skin: '#F2CBAA', hair: '#4E3020', shirt: '#BE5A5A', variant: 1 },
]

function Faces({ indexes, size = 26 }) {
  return (
    <div className="lp-stack">
      {indexes.map(i => (
        <Person key={i} id={`${i}-${size}`} size={size} {...PEOPLE[i]} />
      ))}
    </div>
  )
}

/* ── Brand marks ─────────────────────────────────────────────── */

function GmailMark({ size = 30 }) {
  return (
    <svg width={size} height={size * 0.77} viewBox="0 0 52 40">
      <path fill="#4285F4" d="M3.64 40h8.18V20.18L0 10.91v25.45C0 38.37 1.64 40 3.64 40z" />
      <path fill="#34A853" d="M40.18 40h8.18c2.01 0 3.64-1.64 3.64-3.64V10.91l-11.82 9.27V40z" />
      <path fill="#FBBC04" d="M40.18 3.64v16.55L52 10.91V5.45c0-5.05-5.77-7.94-9.82-4.91l-2 3.1z" />
      <path fill="#EA4335" d="M11.82 20.18V3.64L26 14.27 40.18 3.64v16.55L26 30.81z" />
      <path fill="#C5221F" d="M0 5.45v5.46l11.82 9.27V3.64l-2-3.1C5.77-2.49 0 .4 0 5.45z" />
    </svg>
  )
}

function SlackMark({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 122.8 122.8">
      <path fill="#E01E5A" d="M25.8 77.6a12.9 12.9 0 1 1-12.9-12.9h12.9v12.9z" />
      <path fill="#E01E5A" d="M32.3 77.6a12.9 12.9 0 0 1 25.8 0v32.3a12.9 12.9 0 0 1-25.8 0V77.6z" />
      <path fill="#36C5F0" d="M45.2 25.8a12.9 12.9 0 1 1 12.9-12.9v12.9H45.2z" />
      <path fill="#36C5F0" d="M45.2 32.3a12.9 12.9 0 0 1 0 25.8H12.9a12.9 12.9 0 0 1 0-25.8h32.3z" />
      <path fill="#2EB67D" d="M97 45.2a12.9 12.9 0 1 1 12.9 12.9H97V45.2z" />
      <path fill="#2EB67D" d="M90.5 45.2a12.9 12.9 0 0 1-25.8 0V12.9a12.9 12.9 0 0 1 25.8 0v32.3z" />
      <path fill="#ECB22E" d="M77.6 97a12.9 12.9 0 1 1-12.9 12.9V97h12.9z" />
      <path fill="#ECB22E" d="M77.6 90.5a12.9 12.9 0 0 1 0-25.8h32.3a12.9 12.9 0 0 1 0 25.8H77.6z" />
    </svg>
  )
}

function CalendarMark({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48">
      <polygon fill="#EA4335" points="6,6 42,6 36,12 12,12" />
      <polygon fill="#FBBC04" points="42,6 42,42 36,36 36,12" />
      <polygon fill="#34A853" points="42,42 6,42 12,36 36,36" />
      <polygon fill="#4285F4" points="6,42 6,6 12,12 12,36" />
      <rect x="12" y="12" width="24" height="24" fill="#fff" />
      <text x="24" y="31.5" textAnchor="middle" fill="#1967D2"
        fontFamily="Figtree, Inter, sans-serif" fontSize="17" fontWeight="700">31</text>
    </svg>
  )
}

/* ── Feature icons ───────────────────────────────────────────── */

function IconColumns() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="2.5" y="3.5" width="5" height="17" rx="1.6" fill="#4285F4" />
      <rect x="9.5" y="3.5" width="5" height="11" rx="1.6" fill="#34A853" />
      <rect x="16.5" y="3.5" width="5" height="14" rx="1.6" fill="#FBBC04" />
    </svg>
  )
}
function IconBolt() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24">
      <path d="M13.2 2L4 13.4h6.1L9.9 22l9.3-11.6h-6.2L13.2 2z" fill="#2E6BF6" />
    </svg>
  )
}
function IconPeople() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24">
      <circle cx="9" cy="8" r="3.6" fill="#2E6BF6" />
      <path d="M2.4 20c0-3.6 2.9-6.1 6.6-6.1s6.6 2.5 6.6 6.1H2.4z" fill="#2E6BF6" />
      <circle cx="17.2" cy="9.2" r="2.9" fill="#9DBBF9" />
      <path d="M14 20c0-2.9 1.9-5 4.6-5 2.2 0 3.9 1.4 3.9 3.6V20H14z" fill="#9DBBF9" />
    </svg>
  )
}

/* ══════════════════════════════════════════════════════════════
   Page
   ═════════════════════════════════════════════════════════════ */

export default function LandingPage({ onOpenBoard, onLogin }) {
  const heroRef = useRef(null)
  const navRef = useRef(null)
  const sentinelRef = useRef(null)

  /* Pointer parallax. Values are eased toward the target and written
     as CSS custom properties, so layout never reads back from JS. */
  useEffect(() => {
    const hero = heroRef.current
    if (!hero) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let raf = 0
    let tx = 0, ty = 0, x = 0, y = 0

    const step = () => {
      x += (tx - x) * 0.075
      y += (ty - y) * 0.075
      hero.style.setProperty('--px', x.toFixed(4))
      hero.style.setProperty('--py', y.toFixed(4))
      raf = (Math.abs(tx - x) > 0.0008 || Math.abs(ty - y) > 0.0008)
        ? requestAnimationFrame(step)
        : 0
    }
    const kick = () => { if (!raf) raf = requestAnimationFrame(step) }

    const onMove = (e) => {
      const r = hero.getBoundingClientRect()
      tx = ((e.clientX - r.left) / r.width - 0.5) * 2
      ty = ((e.clientY - r.top) / r.height - 0.5) * 2
      kick()
    }
    const onLeave = () => { tx = 0; ty = 0; kick() }

    hero.addEventListener('mousemove', onMove)
    hero.addEventListener('mouseleave', onLeave)
    return () => {
      hero.removeEventListener('mousemove', onMove)
      hero.removeEventListener('mouseleave', onLeave)
      cancelAnimationFrame(raf)
    }
  }, [])

  /* Kick off the progress-meter fills once painted. */
  useEffect(() => {
    const id = requestAnimationFrame(() => heroRef.current?.classList.add('is-ready'))
    return () => cancelAnimationFrame(id)
  }, [])

  /* Scroll reveal + sticky-nav state. The app scrolls inside <main>,
     not the window, so both use IntersectionObserver rather than
     a scroll listener bound to the wrong element. */
  useEffect(() => {
    const io = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('is-in')
          io.unobserve(e.target)
        }
      }),
      { threshold: 0.15 }
    )
    document.querySelectorAll('.lp-rise').forEach(el => io.observe(el))

    const navIo = new IntersectionObserver(
      ([e]) => navRef.current?.classList.toggle('is-stuck', !e.isIntersecting)
    )
    if (sentinelRef.current) navIo.observe(sentinelRef.current)

    return () => { io.disconnect(); navIo.disconnect() }
  }, [])

  return (
    <div className="lp">
      <div ref={sentinelRef} style={{ position: 'absolute', top: 0, height: 1, width: 1 }} />

      {/* ── Nav ─────────────────────────────────────────────── */}
      <nav className="lp-nav" ref={navRef}>
        <div className="lp-brand">
          <svg width="26" height="26" viewBox="0 0 26 26">
            <circle cx="7" cy="7" r="5" fill="#4FA3F7" />
            <circle cx="19" cy="7" r="5" fill="#1F1F24" />
            <circle cx="7" cy="19" r="5" fill="#1F1F24" />
            <circle cx="19" cy="19" r="5" fill="#1F1F24" />
          </svg>
          CollabKanban
        </div>

        <div className="lp-nav-links">
          {['Features', 'Solutions', 'Resources', 'Pricing'].map(l => (
            <button key={l} className="lp-nav-link">{l}</button>
          ))}
        </div>

        <div className="lp-nav-right">
          <button className="lp-signin" onClick={onLogin}>Sign in</button>
          <button className="lp-ghost-btn" onClick={onLogin}>Get demo</button>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="lp-hero" ref={heroRef}>
        <div className="lp-halftone" />

        <div className="lp-art" aria-hidden="true">
          {/* ── top-left: pinned note over scattered paper ── */}
          <div className="lp-par" style={{ left: '2.6%', top: '6%', '--d': 11 }}>
            <div className="lp-drop" style={{ '--in': '460ms' }}>
              <div className="lp-bob" style={{ '--dur': '11s', '--rot': '-1.5deg' }}>
                <div style={{ position: 'relative', width: 300, height: 320 }}>
                  <div className="lp-paper has-tab" style={{
                    position: 'absolute', left: 0, top: 66,
                    width: 252, height: 236, transform: 'rotate(-5deg)',
                  }} />
                  <div className="lp-paper" style={{
                    position: 'absolute', left: 34, top: 92,
                    width: 246, height: 214, transform: 'rotate(4deg)',
                  }} />
                  <div className="lp-note" style={{ position: 'absolute', left: 22, top: 8, transform: 'rotate(-3deg)' }}>
                    <Pin />
                    Jot down the details that matter, and move every card to done with ease.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── the completed-task tile, floating free ── */}
          <div className="lp-par" style={{ left: '2.1%', top: '30%', '--d': 26 }}>
            <div className="lp-drop" style={{ '--in': '720ms' }}>
              <div className="lp-bob" style={{ '--dur': '7.5s', '--delay': '.6s', '--rot': '-4deg', '--rot-sway': '2deg' }}>
                <div className="lp-tile" style={{ width: 82, height: 82 }}>
                  <CheckGlyph size={44} />
                </div>
              </div>
            </div>
          </div>

          {/* ── top-right: reminders stack ── */}
          <div className="lp-par" style={{ right: '1.6%', top: '5%', '--d': 13 }}>
            <div className="lp-drop" style={{ '--in': '560ms' }}>
              <div className="lp-bob" style={{ '--dur': '12s', '--delay': '.3s', '--rot': '3deg' }}>
                <div style={{ position: 'relative', width: 292, height: 330 }}>
                  <div className="lp-paper has-tab" style={{
                    position: 'absolute', right: 0, top: 74,
                    width: 246, height: 232, transform: 'rotate(6deg)',
                  }} />
                  <div className="lp-paper has-tab" style={{
                    position: 'absolute', right: 22, top: 40,
                    width: 240, height: 236, transform: 'rotate(-2deg)',
                  }} />
                  <div className="lp-paper has-tab" style={{
                    position: 'absolute', right: 40, top: 14, width: 232, padding: '18px 20px 22px',
                  }}>
                    <div className="lp-card-title" style={{ fontSize: 21, marginBottom: 14 }}>Reminders</div>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '7px 10px', marginBottom: 12,
                      borderRadius: 9, background: '#fff',
                      border: '1px solid #EEF0F2',
                      boxShadow: '0 1px 2px rgba(16,24,40,.05)',
                    }}>
                      <span style={{
                        width: 7, height: 7, borderRadius: '50%',
                        background: '#34A853', flex: 'none',
                      }} />
                      <span style={{ fontSize: 12, color: '#5F6368' }}>Board review</span>
                      <span style={{ fontSize: 11, color: '#BDC1C6', marginLeft: 'auto' }}>09:30</span>
                    </div>
                    <div style={{ fontSize: 11.5, color: '#9AA0A6', textAlign: 'right', marginBottom: 2 }}>
                      Meetings
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#202124' }}>Today's standup</div>
                    <div style={{ fontSize: 12.5, color: '#9AA0A6', marginBottom: 14 }}>
                      Sync with the product team
                    </div>
                    <div style={{ fontSize: 11.5, color: '#5F6368', textAlign: 'center', marginBottom: 7 }}>
                      Time
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <span className="lp-time-pill">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                          stroke="currentColor" strokeWidth="2.4">
                          <circle cx="12" cy="12" r="9" />
                          <path d="M12 7.5V12l3 1.8" strokeLinecap="round" />
                        </svg>
                        13:00 – 13:45
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── the stopwatch ── */}
          <div className="lp-par" style={{ right: '21%', top: '13%', '--d': 24 }}>
            <div className="lp-drop" style={{ '--in': '820ms' }}>
              <div className="lp-bob" style={{ '--dur': '8.5s', '--delay': '.9s', '--rot': '5deg', '--rot-sway': '-2.4deg' }}>
                <div className="lp-tile" style={{ width: 112, height: 112 }}>
                  <Stopwatch />
                </div>
              </div>
            </div>
          </div>

          {/* ── bottom-left: today's tasks ── */}
          <div className="lp-par" style={{ left: '2.6%', bottom: '-9%', '--d': 16 }}>
            <div className="lp-drop" style={{ '--in': '640ms' }}>
              <div className="lp-bob" style={{ '--dur': '13s', '--delay': '.45s', '--rot': '-1.5deg' }}>
                <div className="lp-paper has-tab" style={{ width: 306, padding: '22px 22px 26px' }}>
                  <div className="lp-card-title" style={{ fontSize: 20, marginBottom: 18 }}>
                    Today's tasks
                  </div>

                  <div style={{
                    border: '1px solid #EEF0F2', borderRadius: 13, padding: '12px 13px',
                    boxShadow: '0 1px 2px rgba(16,24,40,.04)', marginBottom: 12,
                  }}>
                    <div className="lp-row" style={{ marginBottom: 11 }}>
                      <span className="lp-chip" style={{ background: '#EA5B3A' }}>8</span>
                      <span className="lp-task-name">New ideas for campaign</span>
                      <Faces indexes={[0, 1]} />
                    </div>
                    <div className="lp-row">
                      <span style={{ fontSize: 12, color: '#9AA0A6', flex: 'none' }}>Sep 10</span>
                      <div className="lp-meter" style={{ '--w': '60%', '--c': '#4A9BF5', '--md': '900ms' }}>
                        <i />
                      </div>
                      <span style={{ fontSize: 12.5, fontWeight: 650, flex: 'none' }}>60%</span>
                    </div>
                  </div>

                  <div style={{
                    border: '1px solid #EEF0F2', borderRadius: 13, padding: '12px 13px',
                    boxShadow: '0 1px 2px rgba(16,24,40,.04)',
                  }}>
                    <div className="lp-row" style={{ marginBottom: 11 }}>
                      <span className="lp-chip" style={{ background: '#34A853' }}>3</span>
                      <span className="lp-task-name">Design review #4</span>
                      <Faces indexes={[2, 3]} />
                    </div>
                    <div className="lp-row">
                      <span style={{ fontSize: 12, color: '#9AA0A6', flex: 'none' }}>Sep 18</span>
                      {/* Over budget: the overflow reads red past the plan line */}
                      <div className="lp-meter" style={{ '--w': '100%', '--c': '#4A9BF5', '--md': '1120ms', position: 'relative' }}>
                        <i />
                        <span style={{
                          position: 'absolute', right: 0, top: 0, bottom: 0, width: '22%',
                          background: '#EA5B3A', borderRadius: '0 99px 99px 0',
                        }} />
                      </div>
                      <span style={{ fontSize: 12.5, fontWeight: 650, flex: 'none' }}>112%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── bottom-right: integrations ── */}
          <div className="lp-par" style={{ right: '2.6%', bottom: '-7%', '--d': 16 }}>
            <div className="lp-drop" style={{ '--in': '700ms' }}>
              <div className="lp-bob" style={{ '--dur': '10.5s', '--delay': '.75s', '--rot': '2deg' }}>
                <div className="lp-paper has-tab" style={{ width: 306, padding: '22px 24px 30px' }}>
                  <div className="lp-card-title" style={{ fontSize: 20, marginBottom: 20 }}>
                    100+ Integrations
                  </div>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <div className="lp-tile" style={{ width: 64, height: 64, transform: 'rotate(-4deg)' }}>
                      <GmailMark />
                    </div>
                    <div className="lp-tile" style={{ width: 70, height: 70, transform: 'translateY(-8px)' }}>
                      <SlackMark />
                    </div>
                    <div className="lp-tile" style={{ width: 64, height: 64, transform: 'rotate(4deg)' }}>
                      <CalendarMark />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Hero copy ── */}
        <div className="lp-hero-inner">
          <div className="lp-mark lp-drop" style={{ '--in': '120ms' }}>
            <i /><i /><i /><i />
          </div>

          <h1 className="lp-h1 lp-rise">
            Think, plan, and track
            <br />
            <span className="lp-h1-dim">all in one place</span>
          </h1>

          <p className="lp-sub lp-rise" style={{ '--in': '110ms' }}>
            Efficiently manage your tasks and boost productivity.
          </p>

          <div className="lp-cta-row lp-rise" style={{ '--in': '220ms' }}>
            <button className="lp-cta" onClick={onOpenBoard}>Get free demo</button>
          </div>

          <div className="lp-cta-note lp-rise" style={{ '--in': '300ms' }}>
            Free to start · No credit card required
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────── */}
      <section className="lp-section">
        <div className="lp-center">
          <span className="lp-eyebrow lp-rise">Why CollabKanban</span>
          <h2 className="lp-h2 lp-rise" style={{ '--in': '80ms' }}>
            Everything your team needs,
            <br />
            <span style={{ color: '#A2A6AB' }}>nothing it doesn't</span>
          </h2>
          <p className="lp-lede lp-rise" style={{ '--in': '150ms' }}>
            Boards that stay in sync, columns that match how you actually work,
            and a live view of who's moving what.
          </p>
        </div>

        <div className="lp-grid">
          {[
            {
              icon: <IconColumns />,
              title: 'Boards that fit your flow',
              body: 'Create columns that mirror the way your team really works — then drag cards straight through them.',
            },
            {
              icon: <IconBolt />,
              title: 'Real-time by default',
              body: 'Every move broadcasts over WebSockets the moment it happens. No refresh, no stale board, no guesswork.',
            },
            {
              icon: <IconPeople />,
              title: 'Built for collaboration',
              body: 'Assign owners, follow activity as it lands, and see exactly who is working on what at a glance.',
            },
          ].map((f, i) => (
            <article className="lp-feature lp-rise" key={f.title} style={{ '--in': `${i * 90}ms` }}>
              <div className="lp-feat-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── Closing band ────────────────────────────────────── */}
      <section className="lp-band">
        <div className="lp-halftone" />
        <div style={{ position: 'relative', zIndex: 2 }}>
          <h2 className="lp-h2 lp-rise">Ready to move your first card?</h2>
          <p className="lp-lede lp-rise" style={{ '--in': '90ms', margin: '18px auto 0' }}>
            Spin up a board in seconds and invite the people who matter.
          </p>
          <div className="lp-cta-row lp-rise" style={{ '--in': '170ms' }}>
            <button className="lp-cta" onClick={onOpenBoard}>Get started free</button>
            <button className="lp-ghost-btn" style={{ padding: '15px 28px' }} onClick={onLogin}>
              Sign in
            </button>
          </div>
        </div>
      </section>

      <footer className="lp-foot">
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <svg width="18" height="18" viewBox="0 0 26 26">
            <circle cx="7" cy="7" r="5" fill="#4FA3F7" />
            <circle cx="19" cy="7" r="5" fill="#1F1F24" />
            <circle cx="7" cy="19" r="5" fill="#1F1F24" />
            <circle cx="19" cy="19" r="5" fill="#1F1F24" />
          </svg>
          <span style={{ color: '#3C4043', fontWeight: 600 }}>CollabKanban</span>
        </div>
        <span>© {new Date().getFullYear()} CollabKanban. All rights reserved.</span>
      </footer>
    </div>
  )
}
