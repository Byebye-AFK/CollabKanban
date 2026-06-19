import React from 'react'

/**
 * Column accent spectrum — 8 colours that cycle.
 * Exported so columns and avatars can share the same palette.
 */
export const COLUMN_COLORS = [
  '#7C6FF7', // violet
  '#4F9CF9', // blue
  '#34D399', // emerald
  '#FBBF24', // amber
  '#F87171', // rose
  '#A78BFA', // purple
  '#38BDF8', // sky
  '#FB923C', // orange
]

/**
 * Deterministically pick a background colour from a name string.
 */
function colorFromName(name = '') {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return COLUMN_COLORS[Math.abs(hash) % COLUMN_COLORS.length]
}

function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('')
}

const styles = {
  avatar: (size, bg) => ({
    width: size,
    height: size,
    borderRadius: '50%',
    background: bg,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: size * 0.38,
    fontWeight: 600,
    color: '#fff',
    flexShrink: 0,
    userSelect: 'none',
    letterSpacing: '-0.02em',
    border: '1.5px solid rgba(255,255,255,0.12)',
  }),
}

export default function Avatar({ name, size = 26 }) {
  if (!name) return null
  const bg = colorFromName(name)
  return (
    <div style={styles.avatar(size, bg)} title={name} aria-label={name}>
      {initials(name)}
    </div>
  )
}
