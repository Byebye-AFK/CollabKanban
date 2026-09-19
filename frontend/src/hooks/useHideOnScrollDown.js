import { useEffect, useState } from 'react'

/** Scrolled distance before hiding is allowed at all. */
const HIDE_AFTER = 64

/**
 * Sustained travel in one direction needed to flip the state.
 *
 * A per-event direction check is not enough: fast flicks, trackpad
 * momentum and rubber-banding all produce brief reversals mid-gesture,
 * and each one would toggle the element. Movement is accumulated instead
 * and the accumulator resets whenever the direction turns, so only real
 * intent crosses the line.
 */
const FLIP_THRESHOLD = 28

/**
 * Reports true while the user is scrolling down inside a container.
 *
 * Flips back to false on any upward scroll or near the top, so whatever it
 * hides comes straight back when the user reaches for it. Passing
 * `enabled: false` forces it open — use that whenever the hidden element is
 * in use, so it can never vanish from under the user.
 *
 * @param {React.RefObject<HTMLElement>} containerRef the scrolling element
 * @param {boolean} enabled false pins the result to false
 * @returns {boolean} whether the element should be hidden
 */
export default function useHideOnScrollDown(containerRef, enabled = true) {
  const [isHidden, setIsHidden] = useState(false)

  useEffect(() => {
    if (!enabled) {
      setIsHidden(false)
      return
    }
    const container = containerRef.current
    if (!container) return

    let lastY = container.scrollTop
    let travel = 0
    let frame = null

    const measure = () => {
      frame = null
      const y = container.scrollTop
      const delta = y - lastY
      lastY = y
      if (delta === 0) return

      // Near the top the bar always belongs on screen.
      if (y <= HIDE_AFTER) {
        travel = 0
        setIsHidden(false)
        return
      }

      // A turn discards whatever was accumulated the other way.
      if ((delta > 0) !== (travel > 0)) travel = 0
      travel += delta

      if (travel > FLIP_THRESHOLD) setIsHidden(true)
      else if (travel < -FLIP_THRESHOLD) setIsHidden(false)
    }

    // One measurement per frame, however dense the scroll stream is.
    const schedule = () => {
      if (frame === null) frame = requestAnimationFrame(measure)
    }

    container.addEventListener('scroll', schedule, { passive: true })
    return () => {
      if (frame !== null) cancelAnimationFrame(frame)
      container.removeEventListener('scroll', schedule)
    }
  }, [containerRef, enabled])

  return isHidden
}
