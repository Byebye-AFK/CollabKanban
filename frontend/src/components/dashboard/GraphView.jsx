import React, { useEffect, useMemo, useRef, useState } from 'react'
const GRAPH_COLORS = ['#2E6BF6', '#7C6FF7', '#14B88A', '#E9A13B', '#F0637A', '#38BDF8']

/**
 * GraphView — an Obsidian-style force-directed map of the user's org.
 *
 *   ● you  ──  ●● workspace  ──  ● team
 *
 * Runs a small custom force simulation (repulsion + link springs + centre
 * gravity) on a 2D canvas. The graph is tiny (tens of nodes), so the O(n²)
 * repulsion pass is cheaper than pulling in a layout dependency.
 */

// ── Palette ──────────────────────────────────────────────────
// Node colours are drawn to a canvas, so they can't be CSS tokens.
// These mirror the dashboard's glass palette.
const ROOT_COLOR  = '#10131F'
const ROOT_RING   = 'rgba(46,107,246,0.85)'
const LINK_ON     = 'rgba(58,65,85,0.30)'
const LINK_OFF    = 'rgba(58,65,85,0.08)'
const LABEL_HALO  = 'rgba(255,255,255,0.92)'
const LABEL_STRONG = '#10131F'
const LABEL_MUTED  = '#646C82'
const TIP_BG      = 'rgba(255,255,255,0.96)'
const TIP_LINE    = 'rgba(16,19,31,0.10)'

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
    r: 11, color: ROOT_COLOR, x: 0, y: 0, vx: 0, vy: 0,
  })

  workspaces.forEach((ws, i) => {
    const color = GRAPH_COLORS[i % GRAPH_COLORS.length]
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


const dot = (size, background) => ({
  display: 'inline-block', width: size, height: size, borderRadius: '50%', background,
})

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
        ctx.strokeStyle = on ? LINK_ON : LINK_OFF
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
          // Softer glow: on a light ground a wide bloom turns to haze.
          ctx.shadowColor = n.color
          ctx.shadowBlur = isHover ? 16 : n.type === 'root' ? 8 : 10
        }
        ctx.beginPath()
        ctx.arc(n.x, n.y, n.r + (isHover ? 2 : 0), 0, Math.PI * 2)
        ctx.fillStyle = n.type === 'team' ? `${n.color}A0` : n.color
        ctx.fill()
        ctx.shadowBlur = 0

        if (n.type === 'root') {
          ctx.lineWidth = 2
          ctx.strokeStyle = ROOT_RING
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
        ctx.font = `${n.type === 'team' ? 500 : 600} ${n.type === 'team' ? 10.5 : 12}px Figtree, Inter, system-ui, sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'top'
        ctx.lineWidth = 3
        ctx.strokeStyle = LABEL_HALO // halo keeps labels readable over links
        ctx.strokeText(n.label, n.x, n.y + n.r + 6)
        ctx.fillStyle = n.type === 'team' ? LABEL_MUTED : LABEL_STRONG
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
          ctx.font = '600 12px Figtree, Inter, system-ui, sans-serif'
          const w = Math.max(...lines.map((t, i) => {
            ctx.font = `${i === 0 ? 600 : 500} ${i === 0 ? 12 : 11}px Figtree, Inter, system-ui, sans-serif`
            return ctx.measureText(t).width
          })) + 20
          const h = 44
          let bx = n.x + n.r + 12
          let by = n.y - h / 2
          if (bx + w > size.w - 6) bx = n.x - n.r - 12 - w
          by = Math.min(size.h - h - 6, Math.max(6, by))

          ctx.fillStyle = TIP_BG
          ctx.strokeStyle = TIP_LINE
          ctx.lineWidth = 1
          ctx.beginPath()
          if (ctx.roundRect) ctx.roundRect(bx, by, w, h, 8)
          else ctx.rect(bx, by, w, h)
          ctx.fill()
          ctx.stroke()

          ctx.textAlign = 'left'
          ctx.textBaseline = 'top'
          ctx.font = '600 12px Figtree, Inter, system-ui, sans-serif'
          ctx.fillStyle = LABEL_STRONG
          ctx.fillText(lines[0], bx + 10, by + 9)
          ctx.font = '500 11px Figtree, Inter, system-ui, sans-serif'
          ctx.fillStyle = LABEL_MUTED
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
    <section className="dsh-panel dsh-glass dsh-in is-graph" style={{ '--in': '180ms' }} aria-label="Graph view">
      <div className="dsh-panel-head">
        <div>
          <h2 className="dsh-sec-title">Graph View</h2>
          <div className="dsh-sec-sub">
            {visible.length} workspaces · {teamTotal} teams — drag a node, click a workspace to open it
          </div>
        </div>
        <div className="dsh-panel-actions">
          <button
            className="dsh-iconbtn"
            onClick={reheat}
            title="Re-layout graph"
            aria-label="Re-layout graph"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 1 1-2.6-6.3" /><path d="M21 3v6h-6" />
            </svg>
          </button>
          <select
            className="dsh-select"
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

      <div className="dsh-canvas-wrap" ref={wrapRef}>
        <canvas ref={canvasRef} />
        <div className="dsh-legend">
          <span>
            <i style={{ ...dot(9, ROOT_COLOR), boxShadow: `0 0 0 2px ${ROOT_RING}` }} /> You
          </span>
          <span><i style={dot(11, '#2E6BF6')} /> Workspace</span>
          <span><i style={dot(6, 'rgba(124,111,247,0.75)')} /> Team</span>
        </div>
        <div className="dsh-hint">node size = team count</div>
      </div>
    </section>
  )
}
