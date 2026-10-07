import { describe, test, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'

vi.mock('../../api/teamsApi', async (importOriginal) => ({
  ...(await importOriginal()),
  addTeamMembers: vi.fn(),
}))

import { useBoardTeam } from '../useBoardTeam'
import { addTeamMembers, availableMembers } from '../../api/teamsApi'

const sara = { userId: 11, name: 'Sara Nolan', email: 'sara@example.com' }
const dan = { userId: 12, name: 'Dan Kite', email: 'dan@example.com' }
const aria = { userId: 13, name: 'Aria Patel', email: 'aria@example.com' }

const workspace = (overrides = {}) => ({
  workspaceId: 1,
  name: 'Product Core',
  role: 'OWNER',
  people: [dan, aria],
  teams: [{ id: 7, name: 'Design', memberCount: 1, members: [sara] }],
  ...overrides,
})

describe('useBoardTeam', () => {
  // One object per test: the app passes the same workspace on every
  // render, and local additions are remembered against it.
  let ws

  beforeEach(() => {
    vi.clearAllMocks()
    ws = workspace()
  })

  test('resolves the board\'s team from the workspace it was opened in', () => {
    const { result } = renderHook(() => useBoardTeam(ws, 7))

    expect(result.current.team).toMatchObject({ id: 7, name: 'Design', members: [sara] })
  })

  test('has no team when the board does not belong to one', () => {
    const { result } = renderHook(() => useBoardTeam(workspace(), null))

    expect(result.current.team).toBeNull()
    expect(result.current.canManage).toBe(false)
  })

  test('lets owners and admins manage the team', () => {
    const owner = renderHook(() => useBoardTeam(workspace({ role: 'OWNER' }), 7))
    const admin = renderHook(() => useBoardTeam(workspace({ role: 'ADMIN' }), 7))

    expect(owner.result.current.canManage).toBe(true)
    expect(admin.result.current.canManage).toBe(true)
  })

  test('keeps plain members from managing the team', () => {
    const { result } = renderHook(() => useBoardTeam(workspace({ role: 'MEMBER' }), 7))

    expect(result.current.canManage).toBe(false)
  })

  test('adds the chosen people through the team endpoint', async () => {
    addTeamMembers.mockResolvedValue({ added: [12], failed: [] })
    const { result } = renderHook(() => useBoardTeam(ws, 7))

    await act(async () => { await result.current.addMembers([12]) })

    expect(addTeamMembers).toHaveBeenCalledWith(7, [12])
  })

  test('shows newly added people on the team straight away', async () => {
    addTeamMembers.mockResolvedValue({ added: [12], failed: [] })
    const { result } = renderHook(() => useBoardTeam(ws, 7))

    await act(async () => { await result.current.addMembers([12]) })

    expect(result.current.team.members).toEqual([sara, dan])
    expect(result.current.team.memberCount).toBe(2)
  })

  test('stops offering people who were just added', async () => {
    addTeamMembers.mockResolvedValue({ added: [12], failed: [] })
    const { result } = renderHook(() => useBoardTeam(ws, 7))

    await act(async () => { await result.current.addMembers([12]) })

    expect(availableMembers(result.current.team).map(p => p.userId)).toEqual([13])
  })

  test('only adds the people the server accepted when some fail', async () => {
    addTeamMembers.mockResolvedValue({
      added: [12],
      failed: [{ userId: 13, message: 'Not allowed' }],
    })
    const { result } = renderHook(() => useBoardTeam(ws, 7))

    let outcome
    await act(async () => { outcome = await result.current.addMembers([12, 13]) })

    expect(result.current.team.members).toEqual([sara, dan])
    expect(outcome.failed).toEqual([{ userId: 13, message: 'Not allowed' }])
  })

  test('leaves the team alone when nobody was added', async () => {
    addTeamMembers.mockResolvedValue({ added: [], failed: [{ userId: 12, message: 'No' }] })
    const { result } = renderHook(() => useBoardTeam(ws, 7))

    await act(async () => { await result.current.addMembers([12]) })

    expect(result.current.team.members).toEqual([sara])
  })

  test('returns the server\'s result so the dialog can report failures', async () => {
    const response = { added: [12], failed: [] }
    addTeamMembers.mockResolvedValue(response)
    const { result } = renderHook(() => useBoardTeam(ws, 7))

    let outcome
    await act(async () => { outcome = await result.current.addMembers([12]) })

    expect(outcome).toBe(response)
  })

  test('starts over from a new workspace when the board changes', () => {
    const first = workspace()
    const second = workspace({ teams: [{ id: 7, name: 'Design', memberCount: 0, members: [] }] })
    const { result, rerender } = renderHook(({ ws }) => useBoardTeam(ws, 7), {
      initialProps: { ws: first },
    })

    rerender({ ws: second })

    expect(result.current.team.members).toEqual([])
  })
})
