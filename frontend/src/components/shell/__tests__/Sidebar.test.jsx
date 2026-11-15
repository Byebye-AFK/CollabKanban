import React from 'react'
import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Sidebar from '../Sidebar'
import { createBoard } from '../../../api/boardApi'
import { cacheWorkspace } from '../../../api/dashboardApi'
import { addTeamMembers } from '../../../api/teamsApi'

vi.mock('../../../api/boardApi', () => ({ createBoard: vi.fn() }))
vi.mock('../../../api/dashboardApi', async (importOriginal) => ({
  ...(await importOriginal()),
  cacheWorkspace: vi.fn(),
}))
vi.mock('../../../api/teamsApi', async (importOriginal) => ({
  ...(await importOriginal()),
  addTeamMembers: vi.fn(),
}))

const dan = { userId: 12, name: 'Dan Kite', email: 'dan@example.com' }

const workspace = {
  workspaceId: 7,
  name: 'Backend Team',
  role: 'OWNER',
  people: [dan],
  teams: [{ id: 4, name: 'API', memberCount: 0, members: [] }],
  boards: [{ boardId: 1, name: 'First Board' }],
}

const createFromSidebar = async () => {
  await userEvent.click(screen.getByRole('button', { name: 'New board in Backend Team' }))
  await userEvent.type(screen.getByLabelText('Board name'), 'Sprint 25')
  await userEvent.selectOptions(screen.getByLabelText('Team'), 'API')
  await userEvent.click(screen.getByRole('checkbox', { name: /Dan Kite/ }))
  await userEvent.click(screen.getByRole('button', { name: 'Create board' }))
}

describe('Sidebar — new board', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    createBoard.mockResolvedValue({ boardId: 9, name: 'Sprint 25', teamId: 4, columns: [] })
  })

  test('creates the board, adds the picked people to its team and opens it', async () => {
    addTeamMembers.mockResolvedValue({ added: [12], failed: [] })
    const onOpenBoard = vi.fn()
    render(<Sidebar workspaces={[workspace]} onOpenBoard={onOpenBoard} />)

    await createFromSidebar()

    expect(createBoard).toHaveBeenCalledWith({ name: 'Sprint 25', teamId: 4, workspaceId: 7, position: 1 })
    await waitFor(() => expect(onOpenBoard).toHaveBeenCalled())
    expect(addTeamMembers).toHaveBeenCalledWith(4, [12])

    const [boardId, opened, boardName] = onOpenBoard.mock.calls[0]
    expect(boardId).toBe(9)
    expect(boardName).toBe('Sprint 25')
    expect(opened.boards.map(b => b.boardId)).toEqual([1, 9])
    expect(opened.teams[0].members).toEqual([dan])
    expect(cacheWorkspace).toHaveBeenCalledWith(opened)
  })

  test('keeps the dialog open when someone could not be added', async () => {
    addTeamMembers.mockResolvedValue({ added: [], failed: [{ userId: 12, message: 'Nope' }] })
    const onOpenBoard = vi.fn()
    render(<Sidebar workspaces={[workspace]} onOpenBoard={onOpenBoard} />)

    await createFromSidebar()

    expect(await screen.findByRole('alert')).toHaveTextContent('Dan Kite: Nope')
    expect(onOpenBoard).not.toHaveBeenCalled()

    await userEvent.click(screen.getByRole('button', { name: 'Open board' }))
    expect(onOpenBoard).toHaveBeenCalledWith(9, expect.anything(), 'Sprint 25')
  })
})
