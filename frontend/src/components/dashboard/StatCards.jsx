import React from 'react'
import { Chevron } from '../shell/icons'

/**
 * The four numbers that head the dashboard, as one quiet row.
 *
 * Two counters (workspaces, teams — the latter with a meter per
 * workspace) and two "pick up where you left off" cells that open what
 * they name.
 */
const STAGGER_MS = 50

function Stat({ stat, index }) {
  const clickable = !!stat.onClick
  const Tag = clickable ? 'button' : 'div'

  return (
    <Tag
      className={`dsh-stat ui-in${clickable ? ' is-clickable' : ''}`}
      style={{ '--in': `${index * STAGGER_MS}ms` }}
      onClick={stat.onClick}
      type={clickable ? 'button' : undefined}
    >
      <span className="dsh-stat-label">{stat.label}</span>
      <span className={`dsh-stat-value${stat.small ? ' is-small' : ''}`} title={String(stat.value)}>
        {stat.value}
      </span>
      <span className="dsh-stat-meta">
        {stat.meta}
        {clickable && <Chevron size={12} className="dsh-stat-go" />}
      </span>

      {stat.bars && (
        <span className="dsh-bars" title={stat.barsLabel}>
          {stat.bars.map((b, i) => (
            <span className="dsh-bar" key={i} title={b.title}>
              <i style={{ '--w': `${b.pct}%`, '--md': `${240 + i * 80}ms` }} />
            </span>
          ))}
        </span>
      )}
    </Tag>
  )
}

export default function StatCards({ stats, workspaces, onOpenWorkspace, onOpenBoard }) {
  const { teamCount, boardCount, openCards, lastWorkspace, lastVisitedBoard, lastVisitedLabel } = stats

  const maxTeams = Math.max(1, ...workspaces.map(w => w.teams.length))

  const cards = [
    {
      label: 'Workspaces',
      value: workspaces.length,
      meta: `${boardCount} boards`,
    },
    {
      label: 'Teams',
      value: teamCount,
      meta: `${openCards} open cards`,
      bars: workspaces.map(w => ({
        pct: Math.round((w.teams.length / maxTeams) * 100),
        title: `${w.name} — ${w.teams.length} teams`,
      })),
      barsLabel: 'Teams per workspace',
    },
    {
      label: 'Last workspace',
      value: lastWorkspace ? lastWorkspace.name : 'None yet',
      small: true,
      meta: lastWorkspace ? `${lastWorkspace.teams.length} teams` : 'Open one to get started',
      onClick: lastWorkspace ? () => onOpenWorkspace?.(lastWorkspace) : undefined,
    },
    {
      label: 'Last board',
      value: lastVisitedBoard ? lastVisitedBoard.name : 'None yet',
      small: true,
      meta: lastVisitedBoard
        ? `${lastVisitedBoard.workspaceName || 'Board'} · ${lastVisitedLabel}`
        : 'No boards opened yet',
      onClick: lastVisitedBoard ? () => onOpenBoard?.(lastVisitedBoard.boardId) : undefined,
    },
  ]

  return (
    <section className="dsh-stats" aria-label="Your space">
      {cards.map((c, i) => <Stat key={c.label} stat={c} index={i} />)}
    </section>
  )
}
