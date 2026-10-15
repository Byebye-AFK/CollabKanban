/**
 * The identity spectrum for workspaces and people.
 *
 * Six muted hues that hold white initials legibly and stay distinct
 * from one another at dot size. Shared so avatars, workspace dots and
 * meters tint the same name the same colour wherever it appears.
 */
export const PALETTE = ['#5E6AD2', '#3B8FD9', '#2A9D8F', '#D9822B', '#D6546A', '#8E6DD8']

/**
 * Picks a stable colour for a name.
 *
 * Deterministic rather than index-based, so a workspace keeps its hue
 * when the list is sorted, filtered or regrouped.
 */
export function colorFor(name = '') {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return PALETTE[Math.abs(hash) % PALETTE.length]
}

/** Up to two capitals from a name, for avatar chips. */
export function initials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('')
}
