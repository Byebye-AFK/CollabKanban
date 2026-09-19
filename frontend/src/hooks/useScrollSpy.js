import { useEffect, useState } from 'react'

/** How far below the container's top edge the "you are here" line sits. */
const READING_LINE_OFFSET = 110

/** Treat anything within this many px of the end as "at the bottom". */
const BOTTOM_EPSILON = 4

/**
 * Reports which of `sections` is currently under the reading line of a
 * scrollable container.
 *
 * Sections are measured against the container rather than the viewport, so
 * this works inside an app shell whose page never scrolls. The last section
 * wins once the container is scrolled to the end — otherwise a short final
 * section could never reach the line and would never light up.
 *
 * @param {React.RefObject<HTMLElement>} containerRef the scrolling element
 * @param {{ id: string, ref: React.RefObject<HTMLElement> }[]} sections in document order
 * @param {boolean} enabled pass false while the content is not mounted yet
 * @returns {string|null} the active section id
 */
export default function useScrollSpy(containerRef, sections, enabled = true) {
  const [activeId, setActiveId] = useState(sections[0]?.id ?? null)

  useEffect(() => {
    const container = containerRef.current
    if (!enabled || !container) return

    let frame = null

    const measure = () => {
      frame = null
      const bounds = container.getBoundingClientRect()
      const line = bounds.top + READING_LINE_OFFSET
      const atBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight <= BOTTOM_EPSILON

      let current = sections[0]?.id ?? null
      if (atBottom) {
        current = sections[sections.length - 1]?.id ?? current
      } else {
        for (const section of sections) {
          const node = section.ref.current
          if (node && node.getBoundingClientRect().top <= line) current = section.id
        }
      }
      setActiveId(prev => (prev === current ? prev : current))
    }

    // Coalesce the scroll stream into one measurement per frame.
    const schedule = () => {
      if (frame === null) frame = requestAnimationFrame(measure)
    }

    measure()
    container.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)

    return () => {
      if (frame !== null) cancelAnimationFrame(frame)
      container.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [containerRef, sections, enabled])

  return activeId
}
