import React from 'react'
import { colorFor, initials } from './shell/palette'

/**
 * A person as a coloured disc with their initials.
 *
 * The colour comes from the name, so the same person is the same colour
 * on every card, list and menu. Styled by `.ui-avatar`.
 */
export default function Avatar({ name, size = 20, decorative = false }) {
  if (!name) return null
  return (
    <span
      className="ui-avatar"
      style={{ '--c': colorFor(name), '--size': `${size}px` }}
      title={decorative ? undefined : name}
      aria-label={decorative ? undefined : name}
      aria-hidden={decorative || undefined}
      role={decorative ? undefined : 'img'}
    >
      {initials(name)}
    </span>
  )
}
