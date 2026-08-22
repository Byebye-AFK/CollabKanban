import React, { useEffect, useMemo, useRef, useState } from 'react'
import { COLUMN_COLORS } from '../Avatar'

/**
 * GraphView — an Obsidian-style force-directed map of the user's org.
 *
 *   ● you  ──  ●● workspace  ──  ● team
 *
 * Runs a small custom force simulation (repulsion + link springs + centre
 * gravity) on a 2D canvas. The graph is tiny (tens of nodes), so the O(n²)
 * repulsion pass is cheaper than pulling in a layout dependency.
 */

// ── Simulation constants ─────────────────────────────────────
const REPULSION   = 4600
const SPRING      = 0.035
const CENTER_PULL = 0.004
const DAMPING     = 0.85
const ALPHA_DECAY = 0.988
const ALPHA_MIN   = 0.015

function buildGraph(workspaces, userName) {
  const nodes = []
  const links = []

  nodes.push({
    id: 'me', type: 'root', label: userName || 'You',
    r: 11, color: '#E8E9F4', x: 0, y: 0, vx: 0, vy: 0,
  })

  workspaces.forEach((ws, i) => {
    const color = COLUMN_COLORS[i % COLUMN_COLORS.length]
    const wsId = `w${ws.workspaceId}`
    nodes.push({
      id: wsId, type: 'workspace', label: ws.name, ref: ws,
      r: 15 + Math.min(ws.teams.length, 6) * 1.6,
      color, x: 0, y: 0, vx: 0, vy: 0,
    })
    links.push({ source: 'me', target: wsId, dist: 195 })

    ws.teams.forEach(team => {
      const tId = `${wsId}-${team.id}`
      nodes.push({
        id: tId, type: 'team', label: team.name, ref: team, parent: wsId,
        r: 5 + Math.min(team.memberCount, 8) * 0.75,
        color, x: 0, y: 0, vx: 0, vy: 0,
      })
      links.push({ source: wsId, target: tId, dist: 74 })
    })
  })

  // Seed positions on a spiral so the first frames untangle predictably.
  nodes.forEach((n, i) => {
    const a = i * 2.399
    const rad = i === 0 ? 0 : 30 + i * 9
    n.x = Math.cos(a) * rad
    n.y = Math.sin(a) * rad
  })

  return { nodes, links }
}

const css = {
  panel: { display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0, height: '100%' },
  head: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    gap: 12, marginBottom: 14, flexWrap: 'wrap',
  },
  title: {
    fontSize: 17, fontWeight: 700, color: 'var(--text-primary)',
    letterSpacing: '-0.02em',
  },
  sub: { fontSize: 12, color: 'var(--text-muted)', marginTop: 2 },
  controls: { display: 'flex', alignItems: 'center', gap: 8 },
  select: {
    background: 'var(--bg-card)', border: '1px solid var(--border-input)',
    color: 'var(--text-primary)', fontSize: 12.5, fontWeight: 500,
    borderRadius: 'var(--radius-sm)', padding: '7px 10px', outline: 'none',
    cursor: 'pointer',
  },
  iconBtn: {
    width: 32, height: 32, borderRadius: 'var(--radius-sm)',
    background: 'var(--bg-card)', border: '1px solid var(--border-input)',
    color: 'var(--text-secondary)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
    transition: 'color var(--transition-fast), background var(--transition-fast)',
  },
  canvasWrap: {
    position: 'relative', flex: 1, minHeight: 0,
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border)',
    background:
      'radial-gradient(circle at 50% 45%, rgba(124,111,247,0.10), transparent 62%), var(--bg-board)',
    overflow: 'hidden',
  },
  canvas: { display: 'block', width: '100%', height: '100%', cursor: 'grab' },
  legend: {
    position: 'absolute', left: 14, bottom: 12, display: 'flex',
    gap: 14, alignItems: 'center', pointerEvents: 'none',
  },
  legendItem: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-muted)' },
  dot: (size, bg, ring) => ({
    width: size, height: size, borderRadius: '50%', background: bg,
    boxShadow: ring ? `0 0 0 2px ${ring}` : 'none',
  }),
  hint: {
    position: 'absolute', right: 14, bottom: 12, fontSize: 11,
    color: 'var(--text-muted)', pointerEvents: 'none',
  },
}

export default function GraphView({ workspaces, userName, onSelectWorkspace }) {
  const wrapRef = useRef(null)
  const canvasRef = useRef(null)
  const stateRef = useRef({ nodes: [], links: [], alpha: 1, hover: null, drag: null })
  const [scope, setScope] = useState('all')

  const visible = useMemo(
    () => (scope === 'all' ? workspaces : workspaces.filter(w => String(w.workspaceId) === scope)),
    [workspaces, scope],
  )

  const graph = useMemo(() => buildGraph(visible, userName), [visible, userName])

  // Rebuild + reheat whenever the graph changes.
  useEffect(() => {
    stateRef.current.nodes = graph.nodes
    stateRef.current.links = graph.links
    stateRef.current.hover = null
    stateRef.current.drag = null
    stateRef.current.seeded = false
    stateRef.current.alpha = 0
    stateRef.current.kick?.(0.2)
  }, [graph])

  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return
    const ctx = canvas.getContext('2d')
    let raf
    let size = { w: 0, h: 0 }

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      const { width, height } = wrap.getBoundingClientRect()
      size = { w: width, h: height }
      canvas.width = Math.max(1, Math.round(width * dpr))
      canvas.height = Math.max(1, Math.round(height * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      // Resizing the backing store clears it — repaint now instead of
      // waiting on the next frame.
      if (ready) { ensureSeeded(); draw(); kick(0.35) }
    }
    let ready = false
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(wrap)

    const byId = () => {
      const map = new Map()
      stateRef.current.nodes.forEach(n => map.set(n.id, n))
      return map
    }

    /** One force pass. Alpha scales every force so motion tapers off. */
    const physics = () => {
      const s = stateRef.current
      const { nodes, links } = s
      const cx = size.w / 2
      const cy = size.h / 2
      const map = byId()
      const a = s.alpha

      // Repulsion (every pair)
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const n1 = nodes[i], n2 = nodes[j]
          let dx = n2.x - n1.x, dy = n2.y - n1.y
          let d2 = dx * dx + dy * dy
          if (d2 < 1) { dx = (Math.random() - 0.5); dy = (Math.random() - 0.5); d2 = 1 }
          const d = Math.sqrt(d2)
          const f = (REPULSION / d2) * a
          const fx = (dx / d) * f, fy = (dy / d) * f
          n1.vx -= fx; n1.vy -= fy
          n2.vx += fx; n2.vy += fy
        }
      }

      // Link springs
      for (const l of links) {
        const s1 = map.get(l.source), s2 = map.get(l.target)
        if (!s1 || !s2) continue
        const dx = s2.x - s1.x, dy = s2.y - s1.y
        const d = Math.hypot(dx, dy) || 0.01
        const f = ((d - l.dist) * SPRING) * a
        const fx = (dx / d) * f, fy = (dy / d) * f
        s1.vx += fx; s1.vy += fy
        s2.vx -= fx; s2.vy -= fy
      }

      // Centre gravity + integrate
      for (const n of nodes) {
        if (s.drag === n.id) { n.vx = 0; n.vy = 0; continue }
        n.vx += (cx - n.x) * CENTER_PULL * a
        n.vy += (cy - n.y) * CENTER_PULL * a
        n.vx *= DAMPING; n.vy *= DAMPING
        n.x += n.vx; n.y += n.vy
        // Keep everything inside the panel
        n.x = Math.min(size.w - n.r - 6, Math.max(n.r + 6, n.x))
        n.y = Math.min(size.h - n.r - 18, Math.max(n.r + 6, n.y))
      }
    }

    /**
     * The spiral seed is centred on the origin, so it has to be shifted into
     * the panel the first time we know how big the panel is. We then run the
     * simulation to a near-settled state *before* the first paint, so the
     * graph appears arranged rather than exploding out of the centre.
     */
    const ensureSeeded = () => {
      const s = stateRef.current
      if (s.seeded || size.w === 0 || s.nodes.length === 0) return
      const cx = size.w / 2, cy = size.h / 2
      s.nodes.forEach(n => { n.x += cx; n.y += cy })
      s.seeded = true

      s.alpha = 1
      for (let i = 0; i < 400; i++) { physics(); s.alpha *= 0.992 }
      s.nodes.forEach(n => { n.vx = 0; n.vy = 0 })
      s.alpha = 0.2 // a gentle live settle once the loop takes over
    }

    const tick = () => {
      const s = stateRef.current
      ensureSeeded()
      if (s.alpha <= ALPHA_MIN) return
      physics()
      s.alpha *= ALPHA_DECAY
    }

    const neighboursOf = (id) => {
      const set = new Set([id])
      for (const l of stateRef.current.links) {
        if (l.source === id) set.add(l.target)
        if (l.target === id) set.add(l.source)
      }
      return set
    }

    const draw = () => {
      const s = stateRef.current
      const map = byId()
      const lit = s.hover ? neighboursOf(s.hover) : null
      ctx.clearRect(0, 0, size.w, size.h)

      // Links
      for (const l of s.links) {
        const n1 = map.get(l.source), n2 = map.get(l.target)
        if (!n1 || !n2) continue
        const on = !lit || (lit.has(n1.id) && lit.has(n2.id))
        ctx.strokeStyle = on ? 'rgba(180,186,214,0.32)' : 'rgba(180,186,214,0.07)'
        ctx.lineWidth = on && lit ? 1.4 : 1
        ctx.beginPath()
        ctx.moveTo(n1.x, n1.y)
        ctx.lineTo(n2.x, n2.y)
        ctx.stroke()
      }

      // Nodes
      for (const n of s.nodes) {
        const on = !lit || lit.has(n.id)
        const isHover = s.hover === n.id
        ctx.globalAlpha = on ? 1 : 0.22

        if (on && (n.type !== 'team' || isHover)) {
          ctx.shadowColor = n.color
          ctx.shadowBlur = isHover ? 22 : n.type === 'root' ? 10 : 14
        }
        ctx.beginPath()
        ctx.arc(n.x, n.y, n.r + (isHover ? 2 : 0), 0, Math.PI * 2)
        ctx.fillStyle = n.type === 'team' ? `${n.color}B0` : n.color
        ctx.fill()
        ctx.shadowBlur = 0

        if (n.type === 'root') {
          ctx.lineWidth = 2
          ctx.strokeStyle = 'rgba(124,111,247,0.9)'
          ctx.beginPath()
          ctx.arc(n.x, n.y, n.r + 4.5, 0, Math.PI * 2)
          ctx.stroke()
        }

        ctx.globalAlpha = 1
      }

      // Labels last, so a neighbouring node never sits on top of one.
      // Always shown for you/workspaces; teams label on hover.
      for (const n of s.nodes) {
        const on = !lit || lit.has(n.id)
        const isHover = s.hover === n.id
        if (n.type === 'team' && !isHover && !(lit && lit.has(n.id))) continue
        ctx.globalAlpha = on ? 1 : 0.22
        ctx.font = `${n.type === 'team' ? 500 : 600} ${n.type === 'team' ? 10.5 : 12}px Inter, system-ui, sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'top'
        ctx.lineWidth = 3
        ctx.strokeStyle = 'rgba(17,19,32,0.85)' // halo keeps labels readable over links
        ctx.strokeText(n.label, n.x, n.y + n.r + 6)
        ctx.fillStyle = n.type === 'team' ? '#8B90A7' : '#E8E9F4'
        ctx.fillText(n.label, n.x, n.y + n.r + 6)
        ctx.globalAlpha = 1
      }

      // Hover card
      if (s.hover) {
        const n = map.get(s.hover)
        if (n && n.type !== 'root') {
          const lines =
            n.type === 'workspace'
              ? [n.label, `${n.ref.teams.length} teams · ${n.ref.boards.length} boards · ${n.ref.members.length} members`]
              : [n.label, `${n.ref.memberCount} members`]
          ctx.font = '600 12px Inter, system-ui, sans-serif'
          const w = Math.max(...lines.map((t, i) => {
            ctx.font = `${i === 0 ? 600 : 500} ${i === 0 ? 12 : 11}px Inter, system-ui, sans-serif`
            return ctx.measureText(t).width
          })) + 20
          const h = 44
          let bx = n.x + n.r + 12
          let by = n.y - h / 2
          if (bx + w > size.w - 6) bx = n.x - n.r - 12 - w
          by = Math.min(size.h - h - 6, Math.max(6, by))

          ctx.fillStyle = 'rgba(26,29,46,0.96)'
          ctx.strokeStyle = 'rgba(255,255,255,0.10)'
          ctx.lineWidth = 1
          ctx.beginPath()
          if (ctx.roundRect) ctx.roundRect(bx, by, w, h, 8)
          else ctx.rect(bx, by, w, h)
          ctx.fill()
          ctx.stroke()

          ctx.textAlign = 'left'
          ctx.textBaseline = 'top'
          ctx.font = '600 12px Inter, system-ui, sans-serif'
          ctx.fillStyle = '#E8E9F4'
          ctx.fillText(lines[0], bx + 10, by + 9)
          ctx.font = '500 11px Inter, system-ui, sans-serif'
          ctx.fillStyle = '#8B90A7'
          ctx.fillText(lines[1], bx + 10, by + 25)
        }
      }
    }

    // The loop parks itself once the layout settles and nothing is being
    // hovered or dragged — no idle repaints while the dashboard just sits there.
    let running = false
    const loop = () => {
      const s = stateRef.current
      tick()
      draw()
      if (s.alpha <= ALPHA_MIN && !s.drag && !s.hover) { running = false; return }
      raf = requestAnimationFrame(loop)
    }
    const kick = (a) => {
      const s = stateRef.current
      if (a) s.alpha = Math.max(s.alpha, a)
      if (!running) { running = true; raf = requestAnimationFrame(loop) }
    }
    stateRef.current.kick = kick
    ready = true
    ensureSeeded()
    draw()
    kick(0.2)

    // ── Pointer interaction ──
    const pos = (e) => {
      const r = canvas.getBoundingClientRect()
      return { x: e.clientX - r.left, y: e.clientY - r.top }
    }
    const pick = (p) => {
      const { nodes } = stateRef.current
      for (let i = nodes.length - 1; i >= 0; i--) {
        const n = nodes[i]
        if (Math.hypot(n.x - p.x, n.y - p.y) <= n.r + 5) return n
      }
      return null
    }

    const onMove = (e) => {
      const s = stateRef.current
      const p = pos(e)
      if (s.drag) {
        const n = s.nodes.find(x => x.id === s.drag)
        if (n) { n.x = p.x; n.y = p.y }
        kick(0.35)
        return
      }
      const hit = pick(p)
      const next = hit ? hit.id : null
      if (next !== s.hover) { s.hover = next; kick(0) }
      canvas.style.cursor = hit ? 'pointer' : 'grab'
    }
    const onDown = (e) => {
      const hit = pick(pos(e))
      if (hit) { stateRef.current.drag = hit.id; canvas.style.cursor = 'grabbing'; kick(0) }
    }
    const onUp = () => {
      const s = stateRef.current
      if (s.drag) { s.drag = null; kick(0.4); canvas.style.cursor = 'grab' }
    }
    const onLeave = () => { stateRef.current.hover = null; kick(0); onUp() }
    const onClick = (e) => {
      const hit = pick(pos(e))
      if (hit?.type === 'workspace') onSelectWorkspace?.(hit.ref)
    }

    canvas.addEventListener('mousemove', onMove)
    canvas.addEventListener('mousedown', onDown)
    window.addEventListener('mouseup', onUp)
    canvas.addEventListener('mouseleave', onLeave)
    canvas.addEventListener('click', onClick)

    return () => {
      cancelAnimationFrame(raf)
      stateRef.current.kick = null
      ro.disconnect()
      canvas.removeEventListener('mousemove', onMove)
      canvas.removeEventListener('mousedown', onDown)
      window.removeEventListener('mouseup', onUp)
      canvas.removeEventListener('mouseleave', onLeave)
      canvas.removeEventListener('click', onClick)
    }
  }, [onSelectWorkspace])

  const reheat = () => {
    const s = stateRef.current
    s.nodes.forEach((n, i) => {
      const a = i * 2.399
      const rad = i === 0 ? 0 : 30 + i * 9
      n.x += Math.cos(a) * rad * 0.05
      n.y += Math.sin(a) * rad * 0.05
    })
    s.kick?.(1)
  }

  const teamTotal = visible.reduce((n, w) => n + w.teams.length, 0)

  return (
    <section style={css.panel} aria-label="Graph view">
      <div style={css.head}>
        <div>
          <h2 style={css.title}>Graph View</h2>
          <div style={css.sub}>
            {visible.length} workspaces · {teamTotal} teams — drag a node, click a workspace to open it
          </div>
        </div>
        <div style={css.controls}>
          <button
            style={css.iconBtn}
            onClick={reheat}
            title="Re-layout graph"
            aria-label="Re-layout graph"
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 1 1-2.6-6.3" /><path d="M21 3v6h-6" />
            </svg>
          </button>
          <select
            style={css.select}
            value={scope}
            onChange={e => setScope(e.target.value)}
            aria-label="Graph scope"
          >
            <option value="all">All workspaces</option>
            {workspaces.map(w => (
              <option key={w.workspaceId} value={String(w.workspaceId)}>{w.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={css.canvasWrap} ref={wrapRef}>
        <canvas ref={canvasRef} style={css.canvas} />
        <div style={css.legend}>
          <span style={css.legendItem}>
            <span style={css.dot(9, '#E8E9F4', 'rgba(124,111,247,0.9)')} /> You
          </span>
          <span style={css.legendItem}>
            <span style={css.dot(11, 'var(--accent)')} /> Workspace
          </span>
          <span style={css.legendItem}>
            <span style={css.dot(6, 'rgba(124,111,247,0.7)')} /> Team
          </span>
        </div>
        <div style={css.hint}>node size = team count</div>
      </div>
    </section>
  )
}
