import React from 'react'

/**
 * "Your Space" — the four at-a-glance glass tiles that head the dashboard.
 * Two counters (workspaces / teams) whose footers carry a per-workspace
 * meter, and two "pick up where you left off" tiles.
 */
const PALETTE = ['#2E6BF6', '#7C6FF7', '#14B88A', '#E9A13B', '#F0637A', '#38BDF8']

const Arrow = ({ dir }) => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
    style={{ transform: dir === 'down' ? 'scaleY(-1)' : 'none' }}>
    <path d="M4 17 10 11l4 4 6-6" /><path d="M15 9h5v5" />
  </svg>
)

const ICONS = {
  workspaces: ['M3 7.5 12 3l9 4.5-9 4.5-9-4.5z', 'M3 12l9 4.5 9-4.5', 'M3 16.5 12 21l9-4.5'],
  teams: ['M16 20v-1.5a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4V20', 'M9 10.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z', 'M22 20v-1.5a4 4 0 0 0-3-3.87', 'M16 3.6a4 4 0 0 1 0 7.75'],
  clock: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M12 7v5l3.2 1.9'],
  board: ['M3 4.5h18v15H3z', 'M9 4.5v15', 'M15 4.5v15'],
}

const TileIcon = ({ name }) => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    {ICONS[name].map((p, i) => <path key={i} d={p} />)}
  </svg>
)

function Tile({ stat, index }) {
  const clickable = !!stat.onClick
  return (
    <div
      className={`dsh-stat dsh-glass dsh-in${stat.accent ? ' is-accent' : ''}${clickable ? ' is-clickable' : ''}`}
      style={{ '--in': `${index * 70}ms` }}
      onClick={stat.onClick}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={e => {
        if (clickable && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); stat.onClick() }
      }}
    >
      <div className="dsh-stat-head">
        <span className="dsh-stat-label">{stat.label}</span>
        <span className="dsh-stat-icon"><TileIcon name={stat.icon} /></span>
      </div>

      <div className={`dsh-stat-value${stat.small ? ' is-small' : ''}`} title={String(stat.value)}>
        {stat.value}
      </div>
      <div className="dsh-stat-meta">
        {stat.trend && (
          <span className={`dsh-trend ${stat.trend}`}><Arrow dir={stat.trend} />{stat.trendValue}</span>
        )}
        <span>{stat.meta}</span>
      </div>

      {stat.bars && (
        <div className="dsh-stat-foot">
          <div className="dsh-bars">
            {stat.bars.map((b, i) => (
              <span className="dsh-bar" key={i} title={b.title}>
                <i style={{ '--c': b.color, '--w': `${b.pct}%`, '--md': `${240 + i * 90}ms` }} />
              </span>
            ))}
          </div>
          <div className="dsh-bars-label">{stat.barsLabel}</div>
        </div>
      )}

      {clickable && (
        <div className="dsh-stat-foot">
          <span className="dsh-open">Open <span>→</span></span>
        </div>
      )}
    </div>
  )
}

export default function StatCards({ stats, workspaces, onOpenWorkspace, onOpenBoard }) {
  const { teamCount, boardCount, openCards, lastWorkspace, lastVisitedBoard, lastVisitedLabel } = stats

  const maxTeams = Math.max(1, ...workspaces.map(w => w.teams.length))

  const cards = [
    {
      label: 'Workspaces',
      icon: 'workspaces',
      value: workspaces.length,
      accent: true,
      trend: 'up',
      trendValue: `${boardCount} boards`,
      meta: 'you are a member of',
      bars: workspaces.map((w, i) => ({
        color: PALETTE[i % PALETTE.length],
        pct: w.progress,
        title: `${w.name} — ${w.progress}% done`,
      })),
      barsLabel: 'cards done per workspace',
    },
    {
      label: 'Teams',
      icon: 'teams',
      value: teamCount,
      trend: openCards > 40 ? 'down' : 'up',
      trendValue: `${openCards} open`,
      meta: 'cards across teams',
      bars: workspaces.map((w, i) => ({
        color: PALETTE[i % PALETTE.length],
        pct: Math.round((w.teams.length / maxTeams) * 100),
        title: `${w.name} — ${w.teams.length} teams`,
      })),
      barsLabel: 'teams per workspace',
    },
    {
      label: 'Last workspace',
      icon: 'clock',
      value: lastWorkspace ? lastWorkspace.name : 'None yet',
      small: true,
      meta: lastWorkspace
        ? `${lastWorkspace.teams.length} teams · ${lastWorkspace.lastActiveLabel}`
        : 'open one to get started',
      onClick: lastWorkspace ? () => onOpenWorkspace?.(lastWorkspace) : undefined,
    },
    {
      label: 'Last board',
      icon: 'board',
      value: lastVisitedBoard ? lastVisitedBoard.name : 'None yet',
      small: true,
      meta: lastVisitedBoard
        ? `${lastVisitedBoard.workspaceName || 'Board'} · ${lastVisitedLabel}`
        : 'no boards opened yet',
      onClick: lastVisitedBoard ? () => onOpenBoard?.(lastVisitedBoard.boardId) : undefined,
    },
  ]

  return (
    <section className="dsh-stats" aria-label="Your space">
      {cards.map((c, i) => <Tile key={c.label} stat={c} index={i} />)}
    </section>
  )
}
