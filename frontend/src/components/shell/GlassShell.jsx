import React from 'react'
import Sidebar from './Sidebar'

/**
 * The frosted app shell: aurora ground, nav rail, and a slot for the
 * page's own main column.
 *
 * Every state of a page renders inside the same shell — loading, error
 * and loaded alike — so the background never flashes between them.
 */

/**
 * Four wide blurred pools drifting behind the glass.
 *
 * These are the colour the frost refracts; without them the panels read
 * as flat grey. Each orb carries its own drift vector and duration so
 * they never fall into step with one another.
 */
const ORBS = [
  { className: 'dsh-orb-a', dx: '6%',  dy: '5%',  dur: '28s', delay: '0s' },
  { className: 'dsh-orb-b', dx: '-5%', dy: '7%',  dur: '32s', delay: '-6s' },
  { className: 'dsh-orb-c', dx: '4%',  dy: '-6%', dur: '26s', delay: '-12s' },
  { className: 'dsh-orb-d', dx: '-7%', dy: '-4%', dur: '34s', delay: '-3s' },
]

export function Aurora() {
  return (
    <div className="dsh-aurora" aria-hidden="true">
      {ORBS.map(orb => (
        <i
          key={orb.className}
          className={orb.className}
          style={{ '--dx': orb.dx, '--dy': orb.dy, '--dur': orb.dur, '--delay': orb.delay }}
        />
      ))}
    </div>
  )
}

export default function GlassShell({ children, ...rail }) {
  return (
    <div className="dash">
      <Aurora />
      <Sidebar {...rail} />
      {children}
    </div>
  )
}
