import { useState, useMemo, useCallback } from 'react'
import {
  teamForBoard,
  canManageTeam,
  addTeamMembers,
  withTeamMembers,
} from '../api/teamsApi'

/**
 * useBoardTeam
 * The team behind a board, resolved from the workspace the board was
 * opened in (no extra fetch), plus the one write the board offers:
 * adding workspace people to that team.
 *
 * Added people are folded into local state straight away. The server
 * confirmed each id, and the workspace already holds their name and
 * email, so there is nothing left to ask it for.
 */
export function useBoardTeam(workspace, teamId) {
  // Local additions are remembered against the workspace they were made
  // on. Given a different workspace (another board, a fresh payload) they
  // no longer apply, which resets without an effect that could loop.
  const [local, setLocal] = useState({ source: workspace, value: workspace })
  const current = local.source === workspace ? local.value : workspace

  const team = useMemo(() => teamForBoard(current, teamId), [current, teamId])
  const canManage = team !== null && canManageTeam(current?.role)

  const addMembers = useCallback(async (userIds) => {
    const result = await addTeamMembers(team.id, userIds)
    if (result.added.length > 0) {
      const people = team.workspacePeople.filter(p => result.added.includes(p.userId))
      setLocal(prev => {
        const base = prev.source === workspace ? prev.value : workspace
        return { source: workspace, value: withTeamMembers(base, team.id, people) }
      })
    }
    return result
  }, [team, workspace])

  return { team, canManage, addMembers }
}
