/**
 * The dashboard accent spectrum.
 *
 * Six hues that read clearly against frosted white and stay distinct
 * from one another at chip size. Shared so the stat meters, the
 * workspace table and the board grid tint the same workspace the same
 * colour wherever it appears.
 */
export const PALETTE = ['#2E6BF6', '#7C6FF7', '#14B88A', '#E9A13B', '#F0637A', '#38BDF8']

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
