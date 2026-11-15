import React, { useEffect, useMemo, useRef, useState } from 'react'
import Modal from '../ui/Modal'
import PeoplePicker, { toggled } from '../teams/PeoplePicker'
import { availableMembers, canManageTeam } from '../../api/teamsApi'

/**
 * Name a new board, pick the team it belongs to and, optionally, the
 * workspace people to bring onto that team.
 *
 * The backend has no board membership: a board's people are its team's
 * members. So "people on this board" means adding them to the team, and
 * only roles that may manage teams are offered the list.
 *
 * Teams and people both come from /workspace/mine, so nothing is
 * fetched here. `onSubmit({name, teamId, userIds})` resolves to
 * `{failed, open}`. When some people could not be added the board
 * already exists, so the dialog stays open to say who, and its primary
 * button becomes "Open board" rather than a retry that would create a
 * second board.
 */
function failureLines(failed, people) {
  const nameOf = id => people.find(p => p.userId === id)?.name ?? `User ${id}`
  return failed.map(f => `${nameOf(f.userId)}: ${f.message}`)
}

function submitLabel(submitting, isCreated) {
  if (isCreated) return 'Open board'
  return submitting ? 'Creating…' : 'Create board'
}

function PeopleSection({ workspace, team, canAddPeople, candidates, selected, onToggle }) {
  if (!team) return null
  if (!canAddPeople) {
    return <p className="ui-hint">Only workspace owners and admins can add people to {team.name}.</p>
  }
  return (
    <div className="ui-field">
      <span className="ui-label">Add people to {team.name} (optional)</span>
      {candidates.length === 0 ? (
        <p className="ui-hint">Everyone in {workspace.name} is already on {team.name}.</p>
      ) : (
        <PeoplePicker people={candidates} selected={selected} onToggle={onToggle} />
      )}
    </div>
  )
}

export default function CreateBoardModal({ workspace, onSubmit, onClose }) {
  const teams = workspace.teams ?? []
  const canAddPeople = canManageTeam(workspace.role)
  const [name, setName] = useState('')
  const [teamId, setTeamId] = useState('')
  const [selected, setSelected] = useState(() => new Set())
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState([])
  const [openCreated, setOpenCreated] = useState(null)
  const nameRef = useRef(null)

  // Option values are strings; ids are compared as strings throughout.
  const team = teams.find(t => String(t.id) === teamId)
  const candidates = useMemo(
    () => (team ? availableMembers({ members: team.members, workspacePeople: workspace.people }) : []),
    [team, workspace.people],
  )

  const isCreated = openCreated != null
  const canSubmit = isCreated || (name.trim().length > 0 && team != null && !submitting)

  useEffect(() => { nameRef.current?.focus() }, [])

  const createBoard = async () => {
    setSubmitting(true)
    setErrors([])
    // Picks made under another team may already be on this one; only
    // people still listed are sent, in the order the list shows them.
    const userIds = canAddPeople
      ? candidates.filter(p => selected.has(p.userId)).map(p => p.userId)
      : []
    try {
      const result = await onSubmit({ name: name.trim(), teamId: team.id, userIds })
      if (!result?.failed?.length) return onClose()
      setOpenCreated(() => result.open)
      setErrors(['The board was created, but these people were not added:',
        ...failureLines(result.failed, candidates)])
    } catch (err) {
      setErrors([err.message || 'Could not create the board.'])
    }
    setSubmitting(false)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!canSubmit) return
    if (!isCreated) return createBoard()
    openCreated?.()
    onClose()
  }

  return (
    <Modal
      as="form"
      onSubmit={handleSubmit}
      title="Create a board"
      kicker={workspace.name}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="ui-btn is-ghost" onClick={onClose}>
            {isCreated ? 'Close' : 'Cancel'}
          </button>
          <button type="submit" className="ui-btn is-primary" disabled={!canSubmit}>
            {submitLabel(submitting, isCreated)}
          </button>
        </>
      }
    >
      <label className="ui-field">
        <span className="ui-label">Board name</span>
        <input
          ref={nameRef}
          className="ui-input"
          placeholder="e.g. Sprint 25"
          value={name}
          disabled={isCreated}
          onChange={e => setName(e.target.value)}
        />
      </label>

      {teams.length === 0 ? (
        <p className="ui-hint">
          {workspace.name} has no teams yet. Create one from the Teams page first.
        </p>
      ) : (
        <label className="ui-field">
          <span className="ui-label">Team</span>
          <select
            className="ui-select"
            value={teamId}
            disabled={isCreated}
            onChange={e => setTeamId(e.target.value)}
          >
            <option value="" disabled>Choose a team…</option>
            {teams.map(t => (
              <option key={t.id} value={String(t.id)}>{t.name}</option>
            ))}
          </select>
        </label>
      )}

      {!isCreated && (
        <PeopleSection
          workspace={workspace}
          team={team}
          canAddPeople={canAddPeople}
          candidates={candidates}
          selected={selected}
          onToggle={id => setSelected(prev => toggled(prev, id))}
        />
      )}

      {errors.length > 0 && (
        <div className="ui-error" role="alert">
          {errors.map(message => <div key={message}>{message}</div>)}
        </div>
      )}
    </Modal>
  )
}
