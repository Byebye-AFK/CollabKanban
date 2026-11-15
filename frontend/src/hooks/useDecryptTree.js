import { useLayoutEffect } from 'react'
import { scrambleFrame, prefersReducedMotion } from '../components/ui/EncryptedText'

// ── Tuning ────────────────────────────────────────────────────
/** Time per revealed character for a short string. */
const REVEAL_STEP_MS = 30
/** Longest any one string takes, so a paragraph does not crawl. */
const MAX_REVEAL_MS = 1200
const TICK_MS = 40
/** Elements (and everything inside them) that animate themselves. */
const SKIP_SELECTOR = '[data-no-decrypt]'

/** How many characters of a string of `length` are resolved after `elapsedMs`. */
export function revealedCountAt(elapsedMs, length) {
  if (length === 0) return 0
  const stepMs = Math.min(REVEAL_STEP_MS, MAX_REVEAL_MS / length)
  return Math.floor(elapsedMs / stepMs)
}

function frameText(original, revealedCount) {
  return scrambleFrame(original, revealedCount).map(f => f.char).join('')
}

function collectEntries(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  const entries = []
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (!node.nodeValue.trim()) continue
    if (node.parentElement?.closest(SKIP_SELECTOR)) continue
    const written = frameText(node.nodeValue, 0)
    entries.push({ node, original: node.nodeValue, written })
  }
  return entries
}

/**
 * Scrambles every text node under `ref` and resolves each one back to its
 * real text, left to right, all at once — the whole region "decrypts".
 *
 * Runs once when `isActive` turns true. It edits text nodes in place, so
 * React stays in charge of the tree: a node React rewrites mid-animation
 * is simply left alone, and unmounting restores whatever is still
 * scrambled. Elements marked `data-no-decrypt` are skipped, and reduced
 * motion turns the whole thing off.
 */
export function useDecryptTree(ref, isActive) {
  useLayoutEffect(() => {
    const root = ref.current
    if (!isActive || !root || prefersReducedMotion()) return undefined

    let entries = collectEntries(root)
    if (entries.length === 0) return undefined

    entries.forEach(e => { e.node.nodeValue = e.written })
    root.setAttribute('aria-busy', 'true')
    const startedAt = Date.now()

    const finish = () => {
      clearInterval(timer)
      root.removeAttribute('aria-busy')
    }

    const tick = () => {
      const elapsed = Date.now() - startedAt
      entries = entries
        // A node React rewrote or removed is no longer ours to touch.
        .filter(e => e.node.isConnected && e.node.nodeValue === e.written)
        .map(e => {
          const length = Array.from(e.original).length
          const revealed = revealedCountAt(elapsed, length)
          const written = revealed >= length ? e.original : frameText(e.original, revealed)
          e.node.nodeValue = written
          return { ...e, written }
        })
      if (entries.every(e => e.written === e.original)) finish()
    }

    const timer = setInterval(tick, TICK_MS)

    return () => {
      finish()
      entries.forEach(e => {
        if (e.node.nodeValue === e.written) e.node.nodeValue = e.original
      })
    }
  }, [ref, isActive])
}
