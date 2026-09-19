import React from 'react'

/**
 * A board's completion, drawn as a ring.
 *
 * The arc rests at its true length and only *animates* in, so the value
 * shown is correct even if the animation is skipped, blocked or never
 * starts — the same guarantee the dashboard's meters make.
 */
const SIZE = 44
const STROKE = 4
const RADIUS = (SIZE - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export default function ProgressRing({ percent, color, delay = 0 }) {
  const offset = CIRCUMFERENCE * (1 - Math.max(0, Math.min(100, percent)) / 100)

  return (
    <span className="bds-ring" role="img" aria-label={`${percent}% complete`}>
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden="true">
        <circle
          cx={SIZE / 2} cy={SIZE / 2} r={RADIUS}
          fill="none" stroke="rgba(16, 19, 31, 0.09)" strokeWidth={STROKE}
        />
        <circle
          className="bds-ring-arc"
          cx={SIZE / 2} cy={SIZE / 2} r={RADIUS}
          fill="none" stroke={color} strokeWidth={STROKE} strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          style={{ '--arc': CIRCUMFERENCE, '--md': `${delay}ms` }}
        />
      </svg>
      <span className="bds-ring-text">{percent}<i>%</i></span>
    </span>
  )
}
