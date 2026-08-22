import React from 'react'

/**
 * "Your Space" — the four at-a-glance tiles.
 * Two counters (workspaces / teams) and two "pick up where you left off"
 * tiles (last workspace, last board).
 */
const css = {
  section: { display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0 },
  head: { marginBottom: 14 },
  title: { fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' },
  sub: { fontSize: 12, color: 'var(--text-muted)', marginTop: 2 },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gridTemplateRows: 'repeat(2, minmax(0, 1fr))',
    gap: 12,
    flex: 1,
    minHeight: 0,
  },
  card: (accent, clickable) => ({
    background: accent ? 'var(--accent-light)' : 'var(--bg-card)',
    border: `1px solid ${accent ? 'rgba(124,111,247,0.35)' : 'var(--border)'}`,
    borderRadius: 'var(--radius-lg)',
    padding: '16px 16px 14px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    gap: 12,
    minHeight: 116,
    overflow: 'hidden',
    cursor: clickable ? 'pointer' : 'default',
    transition: 'border-color var(--transition-fast), transform var(--transition-fast)',
  }),
  label: {
    fontSize: 11.5,
    fontWeight: 600,
    color: 'var(--text-secondary)',
    letterSpacing: '0.02em',
    display: 'flex',
    alignItems: 'center',
    gap: 7,
  },
  icon: (accent) => ({
    width: 22, height: 22, borderRadius: 6,
    background: accent ? 'rgba(124,111,247,0.22)' : 'var(--bg-input)',
    color: accent ? 'var(--accent)' : 'var(--text-secondary)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 12, flexShrink: 0,
  }),
  value: (small) => ({
    fontSize: small ? 20 : 30,
    fontWeight: 700,
    color: 'var(--text-primary)',
    letterSpacing: '-0.03em',
    lineHeight: 1.1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }),
  metaRow: {
    display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 600,
    flexWrap: 'wrap', rowGap: 2,
  },
  trend: (dir) => ({
    color: dir === 'down' ? 'var(--danger)' : dir === 'up' ? 'var(--success)' : 'var(--text-muted)',
    display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap',
  }),
  metaText: { color: 'var(--text-muted)', fontWeight: 500, whiteSpace: 'nowrap' },

  // Footer: a per-workspace mini meter on the counters, an affordance on the rest
  footer: { marginTop: 'auto', paddingTop: 12 },
  bars: { display: 'flex', gap: 5 },
  bar: (color, pct) => ({
    flex: 1, height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.07)',
    overflow: 'hidden', position: 'relative',
    backgroundImage: `linear-gradient(90deg, ${color} ${pct}%, transparent ${pct}%)`,
  }),
  barLabel: { fontSize: 10.5, color: 'var(--text-muted)', marginTop: 7, fontWeight: 500 },
  open: {
    display: 'flex', alignItems: 'center', gap: 5,
    fontSize: 12, fontWeight: 600, color: 'var(--accent)',
  },
}

const Arrow = ({ dir }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
    style={{ transform: dir === 'down' ? 'scaleY(-1)' : 'none' }}>
    <path d="M4 17 10 11l4 4 6-6" /><path d="M15 9h5v5" />
  </svg>
)

function Card({ stat }) {
  return (
    <div
      style={css.card(stat.accent, !!stat.onClick)}
      onClick={stat.onClick}
      onMouseEnter={e => { if (stat.onClick) e.currentTarget.style.borderColor = 'var(--border-focus)' }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = stat.accent ? 'rgba(124,111,247,0.35)' : 'var(--border)'
      }}
      role={stat.onClick ? 'button' : undefined}
      tabIndex={stat.onClick ? 0 : undefined}
      onKeyDown={e => { if (stat.onClick && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); stat.onClick() } }}
    >
      <div style={css.label}>
        <span style={css.icon(stat.accent)}>{stat.icon}</span>
        {stat.label}
      </div>
      <div>
        <div style={css.value(stat.small)} title={String(stat.value)}>{stat.value}</div>
        <div style={{ ...css.metaRow, marginTop: 6 }}>
          {stat.trend && (
            <span style={css.trend(stat.trend)}>
              <Arrow dir={stat.trend} />{stat.trendValue}
            </span>
          )}
          <span style={css.metaText}>{stat.meta}</span>
        </div>
      </div>

      {stat.bars && (
        <div style={css.footer}>
          <div style={css.bars}>
            {stat.bars.map((b, i) => <div key={i} style={css.bar(b.color, b.pct)} title={b.title} />)}
          </div>
          <div style={css.barLabel}>{stat.barsLabel}</div>
        </div>
      )}
      {stat.onClick && (
        <div style={{ ...css.footer, ...css.open }}>
          Open <span style={{ fontSize: 14, lineHeight: 1 }}>→</span>
        </div>
      )}
    </div>
  )
}

export default function StatCards({ stats, workspaces, onOpenWorkspace, onOpenBoard }) {
  const { teamCount, boardCount, openCards, lastWorkspace, lastVisitedBoard, lastVisitedLabel } = stats

  const palette = ['#7C6FF7', '#4F9CF9', '#34D399', '#FBBF24', '#F87171', '#A78BFA']
  const maxTeams = Math.max(1, ...workspaces.map(w => w.teams.length))

  const cards = [
    {
      label: 'WORKSPACES',
      icon: '◈',
      value: workspaces.length,
      accent: true,
      trend: 'up',
      trendValue: `${boardCount} boards`,
      meta: 'you are a member of',
      bars: workspaces.map((w, i) => ({
        color: palette[i % palette.length],
        pct: w.progress,
        title: `${w.name} — ${w.progress}% done`,
      })),
      barsLabel: 'cards done per workspace',
    },
    {
      label: 'TEAMS',
      icon: '👥',
      value: teamCount,
      trend: openCards > 40 ? 'down' : 'up',
      trendValue: `${openCards} open`,
      meta: 'cards across teams',
      bars: workspaces.map((w, i) => ({
        color: palette[i % palette.length],
        pct: Math.round((w.teams.length / maxTeams) * 100),
        title: `${w.name} — ${w.teams.length} teams`,
      })),
      barsLabel: 'teams per workspace',
    },
    {
      label: 'LAST WORKSPACE',
      icon: '⏱',
      value: lastWorkspace ? lastWorkspace.name : 'None yet',
      small: true,
      meta: lastWorkspace ? `${lastWorkspace.teams.length} teams · ${lastWorkspace.lastActiveLabel}` : 'open one to get started',
      onClick: lastWorkspace ? () => onOpenWorkspace?.(lastWorkspace) : undefined,
    },
    {
      label: 'LAST BOARD',
      icon: '⊞',
      value: lastVisitedBoard ? lastVisitedBoard.name : 'None yet',
      small: true,
      meta: lastVisitedBoard ? `${lastVisitedBoard.workspaceName || 'Board'} · ${lastVisitedLabel}` : 'no boards opened yet',
      onClick: lastVisitedBoard ? () => onOpenBoard?.(lastVisitedBoard.boardId) : undefined,
    },
  ]

  return (
    <section style={css.section} aria-label="Your space">
      <div style={css.head}>
        <h2 style={css.title}>Your Space</h2>
        <div style={css.sub}>A snapshot of where you left off</div>
      </div>
      <div style={css.grid}>
        {cards.map(c => <Card key={c.label} stat={c} />)}
      </div>
    </section>
  )
}
