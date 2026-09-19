import React, { useState } from 'react'
import { Chevron } from '../shell/icons'
import { colorFor } from '../shell/palette'
import { groupByWorkspace } from '../../api/library'

/**
 * A library grid, in either arrangement.
 *
 * Knows nothing about what it is showing — the caller supplies the card
 * via `renderItem`, so boards and teams share one grouping, one stagger
 * and one set of collapse mechanics.
 *
 * The stagger index runs continuously across groups rather than
 * restarting at each heading, so the whole page cascades in as one
 * motion instead of several competing ones.
 */

/** Beyond this, the stagger stops growing — a long list should not crawl in. */
const MAX_STAGGER_STEPS = 14

function staggerIndex(i) {
  return Math.min(i, MAX_STAGGER_STEPS)
}

function WorkspaceGroup({ group, startIndex, noun, renderItem, getKey }) {
  const [isOpen, setOpen] = useState(true)
  const color = colorFor(group.name)

  return (
    <section className="lib-group" aria-label={group.name}>
      <h3 className="lib-group-heading">
        <button
          className={`lib-group-head${isOpen ? ' is-open' : ''}`}
          onClick={() => setOpen(o => !o)}
          aria-expanded={isOpen}
        >
          <Chevron className="lib-group-chevron" />
          <span className="lib-group-dot" style={{ background: color }} aria-hidden="true" />
          <span className="lib-group-name">{group.name}</span>
          <span className="lib-group-count">
            {group.items.length} {group.items.length === 1 ? noun : `${noun}s`}
          </span>
        </button>
      </h3>

      {/* 0fr → 1fr lets the panel animate to its natural height without
          anyone having to measure it first. */}
      <div className={`lib-group-body${isOpen ? ' is-open' : ''}`}>
        <div className="lib-group-inner">
          <div className="lib-grid">
            {group.items.map((item, i) => renderItem(item, staggerIndex(startIndex + i), getKey(item)))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default function LibraryGrid({ items, view, noun, renderItem, getKey }) {
  if (view === 'grouped') {
    const groups = groupByWorkspace(items)
    let cursor = 0

    return (
      <div className="lib-groups">
        {groups.map(group => {
          const startIndex = cursor
          cursor += group.items.length
          return (
            <WorkspaceGroup
              key={group.workspaceId}
              group={group}
              startIndex={startIndex}
              noun={noun}
              renderItem={renderItem}
              getKey={getKey}
            />
          )
        })}
      </div>
    )
  }

  return (
    <div className="lib-grid">
      {items.map((item, i) => renderItem(item, staggerIndex(i), getKey(item)))}
    </div>
  )
}
