import React from 'react'

/**
 * A board's completion as a small ring, the way Linear marks project
 * progress: a faint track with the done share drawn over it.
 *
 * The arc rests at its true length and only *animates* in, so the value
 * shown is correct even if the animation is skipped or never starts.
 */
const SIZE = 16
const STROKE = 2
const RADIUS = (SIZE - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export default function ProgressRing({ percent, delay = 0 }) {
  const clamped = Math.max(0, Math.min(100, percent))
  const offset = CIRCUMFERENCE * (1 - clamped / 100)

  return (
    <span className="bds-ring" role="img" aria-label={`${percent}% complete`}>
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden="true">
        <circle
          cx={SIZE / 2} cy={SIZE / 2} r={RADIUS}
          fill="none" stroke="var(--line-strong)" strokeWidth={STROKE}
        />
        <circle
          className="bds-ring-arc"
          cx={SIZE / 2} cy={SIZE / 2} r={RADIUS}
          fill="none" stroke="var(--accent)" strokeWidth={STROKE} strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          style={{ '--arc': CIRCUMFERENCE, '--md': `${delay}ms` }}
        />
      </svg>
      <span className="bds-ring-text">{percent}%</span>
    </span>
  )
}
