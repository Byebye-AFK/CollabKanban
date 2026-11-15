import React, { useEffect, useState } from 'react'

// ── Tuning ────────────────────────────────────────────────────
const DEFAULT_CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
const DEFAULT_REVEAL_DELAY_MS = 50
const DEFAULT_FLIP_DELAY_MS = 50

// ── Frames ────────────────────────────────────────────────────

/**
 * One frame of the effect: the first `revealedCount` characters are the
 * real text, the rest are random picks from `charset`. Spaces always show
 * (and any other whitespace) so word shapes stay put. `random` is injectable for tests.
 */
export function scrambleFrame(text, revealedCount, charset = DEFAULT_CHARSET, random = Math.random) {
  return Array.from(text, (char, i) => {
    const isRevealed = i < revealedCount || /\s/.test(char)
    const shown = isRevealed ? char : charset[Math.floor(random() * charset.length)]
    return { char: shown, isRevealed }
  })
}

export function prefersReducedMotion() {
  try {
    return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
  } catch {
    return false
  }
}

/**
 * Text that starts as noise and resolves left to right into the real
 * characters, like decrypting.
 *
 * With `animate={false}`, or when the user prefers reduced motion, it
 * renders the plain text. Screen readers always get the real text; the
 * scrambled glyphs are hidden from them.
 */
export default function EncryptedText({
  text,
  animate = true,
  revealDelayMs = DEFAULT_REVEAL_DELAY_MS,
  flipDelayMs = DEFAULT_FLIP_DELAY_MS,
  charset = DEFAULT_CHARSET,
  className = '',
  encryptedClassName = '',
  revealedClassName = '',
}) {
  const isPlain = !animate || prefersReducedMotion()
  const [frame, setFrame] = useState(() => scrambleFrame(text, 0, charset))

  useEffect(() => {
    if (isPlain) return undefined

    const total = Array.from(text).length
    const startedAt = Date.now()
    setFrame(scrambleFrame(text, 0, charset))

    const timer = setInterval(() => {
      const revealed = Math.floor((Date.now() - startedAt) / revealDelayMs)
      setFrame(scrambleFrame(text, revealed, charset))
      if (revealed >= total) clearInterval(timer)
    }, Math.min(flipDelayMs, revealDelayMs))

    return () => clearInterval(timer)
  }, [text, isPlain, revealDelayMs, flipDelayMs, charset])

  if (isPlain) return <span className={className || undefined}>{text}</span>

  return (
    <span className={className || undefined}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {frame.map(({ char, isRevealed }, i) => (
          <span
            key={i}
            className={isRevealed ? revealedClassName || undefined : `enc-glyph ${encryptedClassName}`.trim()}
          >
            {char}
          </span>
        ))}
      </span>
    </span>
  )
}
