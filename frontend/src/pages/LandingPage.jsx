import React, { useEffect, useRef } from 'react'
import Avatar from '../components/Avatar'
import { StatusIcon, UnassignedIcon } from '../components/shell/icons'
import { STATUS } from '../api/boardStatus'
import './LandingPage.css'

/**
 * LandingPage — the signed-out front door.
 *
 * Minimal and flat like the app itself, with motion doing the selling:
 * the headline rises in word by word, a small live board shows a card
 * travelling Todo → In Progress → Done while its status mark changes,
 * sections fade up as they scroll in, and feature icons draw themselves.
 * Everything is CSS animation; JS only adds the pointer tilt, the
 * scroll reveals and the nav's scrolled state. With reduced motion on,
 * every piece rests in its final state.
 */

const HEADLINE = [
  { words: ['Think,', 'plan,', 'and', 'track'], dim: false },
  { words: ['all', 'in', 'one', 'place'], dim: true },
]

/** Stagger between headline words, in ms. */
const WORD_STAGGER_MS = 45

const FEATURES = [
  {
    title: 'Boards that fit your flow',
    body: 'Create columns that mirror the way your team really works — then drag cards straight through them.',
    paths: ['M4 4.5h16v15H4z', 'M9.5 4.5v15', 'M14.5 4.5v15'],
  },
  {
    title: 'Real-time by default',
    body: 'Every move broadcasts the moment it happens. No refresh, no stale board, no guesswork.',
    paths: ['M13 3 5 13.5h6L10 21l8-10.5h-6z'],
  },
  {
    title: 'Built for collaboration',
    body: 'Assign owners, follow activity as it lands, and see exactly who is working on what at a glance.',
    paths: ['M16 20v-1.5a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4V20', 'M9 10.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z', 'M22 20v-1.5a4 4 0 0 0-3-3.87', 'M16 3.6a4 4 0 0 1 0 7.75'],
  },
]

/** The preview board: three columns, a few resting cards each. */
const PREVIEW = [
  { name: 'Todo', status: STATUS.TODO, count: 3, cards: [
    { key: 'CK-24', title: 'Write the launch post', who: 'Aria Patel' },
    { key: 'CK-31', title: 'Pricing page copy' },
  ]},
  { name: 'In Progress', status: STATUS.STARTED, count: 2, cards: [
    { key: 'CK-18', title: 'Realtime presence', who: 'Dan Kite' },
  ]},
  { name: 'Done', status: STATUS.DONE, count: 6, cards: [
    { key: 'CK-12', title: 'Board drag and drop', who: 'Sara Nolan' },
    { key: 'CK-09', title: 'Google sign-in', who: 'Miles Fox' },
  ]},
]

const Brand = () => (
  <span className="lp-brand">
    <span className="app-brand-mark" aria-hidden="true"><i /><i /><i /></span>
    CollabKanban
  </span>
)

/** A line icon whose strokes draw on when its section scrolls in. */
const DrawIcon = ({ paths }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {paths.map(d => <path key={d} d={d} pathLength="1" className="lp-draw" />)}
  </svg>
)

function PreviewCard({ card, status }) {
  return (
    <div className="lp-card">
      <div className="lp-card-top">
        <span>{card.key}</span>
        {card.who ? <Avatar name={card.who} size={16} decorative /> : <UnassignedIcon size={14} />}
      </div>
      <div className="lp-card-title"><StatusIcon status={status} size={12} />{card.title}</div>
    </div>
  )
}

/**
 * The card that travels. Its three status marks are stacked and
 * cross-faded in step with the move, and an assignee fades in on the
 * way, as if someone picked it up live.
 */
function TravellingCard() {
  return (
    <div className="lp-card lp-traveller" aria-hidden="true">
      <div className="lp-card-top">
        <span>CK-27</span>
        <span className="lp-traveller-who"><Avatar name="Sara Nolan" size={16} decorative /></span>
      </div>
      <div className="lp-card-title">
        <span className="lp-traveller-status">
          <StatusIcon status={STATUS.TODO} size={12} className="is-todo" />
          <StatusIcon status={STATUS.STARTED} size={12} className="is-started" />
          <StatusIcon status={STATUS.DONE} size={12} className="is-done" />
        </span>
        Ship the new board
      </div>
    </div>
  )
}

function BoardPreview() {
  return (
    <div className="lp-preview" role="img" aria-label="A CollabKanban board with a card moving from Todo to Done">
      <div className="lp-preview-bar">
        <span className="lp-preview-crumb">Product Core <i>›</i> <b>Launch</b></span>
        <span className="lp-preview-tabs"><span className="is-on">All cards</span><span>Active</span><span>Backlog</span></span>
      </div>
      <div className="lp-preview-board">
        {PREVIEW.map(col => (
          <div className="lp-col" key={col.name}>
            <div className="lp-col-head">
              <StatusIcon status={col.status} size={12} />
              <b>{col.name}</b>
              <span>{col.count}</span>
            </div>
            <div className="lp-slot" />
            {col.cards.map(c => <PreviewCard key={c.key} card={c} status={col.status} />)}
          </div>
        ))}
        <TravellingCard />
      </div>
    </div>
  )
}

export default function LandingPage({ onOpenBoard, onLogin }) {
  const rootRef = useRef(null)
  const heroRef = useRef(null)
  const navRef = useRef(null)
  const sentinelRef = useRef(null)
  const previewRef = useRef(null)

  /* Pointer tilt for the preview. Values are eased toward the target
     and written as CSS custom properties, so layout never reads back
     from JS. */
  useEffect(() => {
    const hero = heroRef.current
    if (!hero) return undefined
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined

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

  /* Scroll reveals, the nav's scrolled state, and pausing the preview
     loop while it is off-screen. The app scrolls inside <main>, not the
     window, so all three use IntersectionObserver rather than a scroll
     listener bound to the wrong element. */
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return undefined

    const reveal = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('is-in')
          reveal.unobserve(e.target)
        }
      }),
      { threshold: 0.15 }
    )
    rootRef.current?.querySelectorAll('.lp-rise').forEach(el => reveal.observe(el))

    const nav = new IntersectionObserver(
      ([e]) => navRef.current?.classList.toggle('is-stuck', !e.isIntersecting)
    )
    if (sentinelRef.current) nav.observe(sentinelRef.current)

    const pause = new IntersectionObserver(
      ([e]) => previewRef.current?.classList.toggle('is-paused', !e.isIntersecting)
    )
    if (previewRef.current) pause.observe(previewRef.current)

    return () => { reveal.disconnect(); nav.disconnect(); pause.disconnect() }
  }, [])

  let wordIndex = 0

  return (
    <div className="lp" ref={rootRef}>
      <div ref={sentinelRef} className="lp-sentinel" />

      {/* ── Nav ─────────────────────────────────────────────── */}
      <nav className="lp-nav" ref={navRef}>
        <Brand />
        <div className="lp-nav-right">
          <button className="ui-btn is-ghost" onClick={onLogin}>Sign in</button>
          <button className="ui-btn is-primary" onClick={onOpenBoard}>Get started</button>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="lp-hero" ref={heroRef}>
        <span className="lp-pill lp-fade" style={{ '--in': '0ms' }}>
          <span className="lp-pill-dot" /> Live boards for teams
        </span>

        <h1 className="lp-h1">
          {HEADLINE.map((line, li) => (
            <span key={li} className={`lp-line${line.dim ? ' is-dim' : ''}`}>
              {line.words.map(word => {
                const delay = 80 + wordIndex++ * WORD_STAGGER_MS
                return (
                  <span className="lp-word" key={word}>
                    <span style={{ '--in': `${delay}ms` }}>{word}</span>
                  </span>
                )
              })}
            </span>
          ))}
        </h1>

        <p className="lp-sub lp-fade" style={{ '--in': '520ms' }}>
          Efficiently manage your tasks and boost productivity — together, in real time.
        </p>

        <div className="lp-cta-row lp-fade" style={{ '--in': '620ms' }}>
          <button className="ui-btn is-primary lp-cta" onClick={onOpenBoard}>Get started — it's free</button>
          <button className="ui-btn lp-cta" onClick={onLogin}>Sign in</button>
        </div>

        <div className="lp-stage lp-fade" style={{ '--in': '760ms' }} ref={previewRef}>
          <div className="lp-tilt">
            <BoardPreview />
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────── */}
      <section className="lp-section" id="features">
        <div className="lp-center">
          <h2 className="lp-h2 lp-rise">
            Everything your team needs, <span className="is-dim">nothing it doesn't</span>
          </h2>
          <p className="lp-lede lp-rise" style={{ '--in': '80ms' }}>
            Boards that stay in sync, columns that match how you actually work,
            and a live view of who's moving what.
          </p>
        </div>

        <div className="lp-grid">
          {FEATURES.map((f, i) => (
            <article className="lp-feature lp-rise" key={f.title} style={{ '--in': `${i * 90}ms` }}>
              <span className="lp-feat-icon"><DrawIcon paths={f.paths} /></span>
              <h3>{f.title}</h3>
              <p>{f.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── Closing ─────────────────────────────────────────── */}
      <section className="lp-section lp-closing">
        <h2 className="lp-h2 lp-rise">Ready to move your first card?</h2>
        <p className="lp-lede lp-rise" style={{ '--in': '80ms' }}>
          Spin up a board in seconds and invite the people who matter.
        </p>
        <div className="lp-cta-row lp-rise" style={{ '--in': '160ms' }}>
          <button className="ui-btn is-primary lp-cta" onClick={onOpenBoard}>Get started free</button>
          <button className="ui-btn lp-cta" onClick={onLogin}>Sign in</button>
        </div>
      </section>

      <footer className="lp-foot">
        <Brand />
        <span>© {new Date().getFullYear()} CollabKanban</span>
      </footer>
    </div>
  )
}
