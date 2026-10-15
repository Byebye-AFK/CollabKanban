import React from 'react'

/**
 * Loading state shaped like the list it becomes.
 *
 * Placeholder rows in the final layout mean the page does not reflow
 * when the data lands — the rows fill in where the placeholders were.
 */
const PLACEHOLDER_COUNT = 6

export default function LibraryGridSkeleton() {
  return (
    <div className="lib-grid" aria-hidden="true">
      {Array.from({ length: PLACEHOLDER_COUNT }, (_, i) => (
        <div className="lib-card lib-skeleton" key={i} style={{ '--in': `${i * 40}ms` }}>
          <span className="ui-skeleton lib-sk-icon" />
          <span className="ui-skeleton lib-sk-name" />
          <span className="ui-skeleton lib-sk-chip" />
          <span className="ui-skeleton lib-sk-meta" />
        </div>
      ))}
    </div>
  )
}
