import React from 'react'
import Avatar from '../Avatar'
import './teams.css'

/**
 * A checkbox list of people, shared by the dialogs that add people to
 * a team. Selection lives with the caller, as a Set of user ids.
 */
export default function PeoplePicker({ people, selected, onToggle, children }) {
  return (
    <ul className="tms-people">
      {people.map(person => (
        <li key={person.userId}>
          <label className={`tms-person${selected.has(person.userId) ? ' is-on' : ''}`}>
            <input
              type="checkbox"
              checked={selected.has(person.userId)}
              onChange={() => onToggle(person.userId)}
            />
            <Avatar name={person.name} size={24} decorative />
            <span className="tms-person-text">
              <span className="tms-person-name">{person.name}</span>
              {person.email && <span className="tms-person-email">{person.email}</span>}
            </span>
          </label>
        </li>
      ))}
      {children}
    </ul>
  )
}

/** A new Set with `id` flipped in or out, leaving `set` untouched. */
export function toggled(set, id) {
  const next = new Set(set)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  return next
}
