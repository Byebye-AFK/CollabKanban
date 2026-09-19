import React from 'react'

/**
 * Loading state shaped like the grid it becomes.
 *
 * A skeleton in the final layout means the page does not reflow when the
 * data lands — the cards fill in where the placeholders already were.
 */
const PLACEHOLDER_COUNT = 6

export default function LibraryGridSkeleton() {
  return (
    <div className="lib-grid" aria-hidden="true">
      {Array.from({ length: PLACEHOLDER_COUNT }, (_, i) => (
        <div className="lib-card lib-skeleton dsh-glass" key={i} style={{ '--in': `${i * 55}ms` }}>
          <div className="lib-card-head">
            <span className="lib-sk lib-sk-mark" />
            <span className="lib-sk lib-sk-ring" />
          </div>
          <span className="lib-sk lib-sk-line" />
          <span className="lib-sk lib-sk-chip" />
          <div className="lib-card-foot">
            <span className="lib-sk lib-sk-stack" />
            <span className="lib-sk lib-sk-meta" />
          </div>
        </div>
      ))}
    </div>
  )
}
