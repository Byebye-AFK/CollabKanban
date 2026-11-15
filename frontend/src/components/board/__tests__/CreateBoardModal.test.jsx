import React from 'react'
import { describe, test, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CreateBoardModal from '../CreateBoardModal'

const sara = { userId: 11, name: 'Sara Nolan', email: 'sara@example.com' }
const dan = { userId: 12, name: 'Dan Kite', email: 'dan@example.com' }

const workspace = {
  workspaceId: 7,
  name: 'Backend Team',
  role: 'OWNER',
  people: [sara, dan],
  teams: [
    { id: 3, name: 'Design', members: [sara] },
    { id: 4, name: 'API', members: [] },
  ],
}

const fill = async (name, team) => {
  await userEvent.type(screen.getByLabelText('Board name'), name)
  await userEvent.selectOptions(screen.getByLabelText('Team'), team)
}

describe('CreateBoardModal', () => {
  test('keeps create disabled until a name is typed and a team is picked', async () => {
    render(<CreateBoardModal workspace={workspace} onSubmit={vi.fn()} onClose={vi.fn()} />)
    const submit = screen.getByRole('button', { name: 'Create board' })

    expect(submit).toBeDisabled()
    await userEvent.type(screen.getByLabelText('Board name'), '   ')
    expect(submit).toBeDisabled()
    await userEvent.type(screen.getByLabelText('Board name'), 'Sprint 25')
    expect(submit).toBeDisabled()
    await userEvent.selectOptions(screen.getByLabelText('Team'), 'API')
    expect(submit).toBeEnabled()
  })

  test('lists only the teams of the given workspace', () => {
    render(<CreateBoardModal workspace={workspace} onSubmit={vi.fn()} onClose={vi.fn()} />)

    const names = screen.getAllByRole('option').map(o => o.textContent)
    expect(names).toEqual(['Choose a team…', 'Design', 'API'])
  })

  test('submits the trimmed name and team with no people by default', async () => {
    const onSubmit = vi.fn().mockResolvedValue({ failed: [] })
    const onClose = vi.fn()
    render(<CreateBoardModal workspace={workspace} onSubmit={onSubmit} onClose={onClose} />)

    await fill('  Sprint 25 ', 'API')
    await userEvent.click(screen.getByRole('button', { name: 'Create board' }))

    expect(onSubmit).toHaveBeenCalledWith({ name: 'Sprint 25', teamId: 4, userIds: [] })
    await waitFor(() => expect(onClose).toHaveBeenCalled())
  })

  test('offers workspace people not already on the picked team', async () => {
    render(<CreateBoardModal workspace={workspace} onSubmit={vi.fn()} onClose={vi.fn()} />)

    await fill('Sprint 25', 'Design')

    expect(screen.getByRole('checkbox', { name: /Dan Kite/ })).toBeInTheDocument()
    expect(screen.queryByRole('checkbox', { name: /Sara Nolan/ })).not.toBeInTheDocument()
  })

  test('submits the people picked for the board', async () => {
    const onSubmit = vi.fn().mockResolvedValue({ failed: [] })
    render(<CreateBoardModal workspace={workspace} onSubmit={onSubmit} onClose={vi.fn()} />)

    await fill('Sprint 25', 'API')
    await userEvent.click(screen.getByRole('checkbox', { name: /Dan Kite/ }))
    await userEvent.click(screen.getByRole('checkbox', { name: /Sara Nolan/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Create board' }))

    expect(onSubmit).toHaveBeenCalledWith({ name: 'Sprint 25', teamId: 4, userIds: [12, 11] })
  })

  test('drops a pick that is already on a team chosen afterwards', async () => {
    const onSubmit = vi.fn().mockResolvedValue({ failed: [] })
    render(<CreateBoardModal workspace={workspace} onSubmit={onSubmit} onClose={vi.fn()} />)

    await fill('Sprint 25', 'API')
    await userEvent.click(screen.getByRole('checkbox', { name: /Sara Nolan/ }))
    await userEvent.selectOptions(screen.getByLabelText('Team'), 'Design')
    await userEvent.click(screen.getByRole('button', { name: 'Create board' }))

    expect(onSubmit).toHaveBeenCalledWith({ name: 'Sprint 25', teamId: 3, userIds: [] })
  })

  test('hides the people list from members who cannot manage teams', async () => {
    render(
      <CreateBoardModal workspace={{ ...workspace, role: 'MEMBER' }} onSubmit={vi.fn()} onClose={vi.fn()} />,
    )

    await fill('Sprint 25', 'API')

    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
    expect(screen.getByText(/Only workspace owners and admins/)).toBeInTheDocument()
  })

  test('says so when everyone is already on the team', async () => {
    const full = { ...workspace, teams: [{ id: 3, name: 'Design', members: [sara, dan] }] }
    render(<CreateBoardModal workspace={full} onSubmit={vi.fn()} onClose={vi.fn()} />)

    await fill('Sprint 25', 'Design')

    expect(screen.getByText(/already on Design/)).toBeInTheDocument()
  })

  test('explains that a team is needed when the workspace has none', () => {
    render(
      <CreateBoardModal workspace={{ ...workspace, teams: [] }} onSubmit={vi.fn()} onClose={vi.fn()} />,
    )

    expect(screen.getByText(/has no teams yet/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create board' })).toBeDisabled()
  })

  test('shows the server message and stays open when creation fails', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error('Workspace not found'))
    const onClose = vi.fn()
    render(<CreateBoardModal workspace={workspace} onSubmit={onSubmit} onClose={onClose} />)

    await fill('Sprint 25', 'Design')
    await userEvent.click(screen.getByRole('button', { name: 'Create board' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Workspace not found')
    expect(onClose).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Create board' })).toBeEnabled()
  })

  test('after a partial failure, names who was not added and offers to open the board', async () => {
    const open = vi.fn()
    const onSubmit = vi.fn().mockResolvedValue({ failed: [{ userId: 12, message: 'Already a member' }], open })
    const onClose = vi.fn()
    render(<CreateBoardModal workspace={workspace} onSubmit={onSubmit} onClose={onClose} />)

    await fill('Sprint 25', 'API')
    await userEvent.click(screen.getByRole('checkbox', { name: /Dan Kite/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Create board' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Dan Kite: Already a member')
    expect(onClose).not.toHaveBeenCalled()

    await userEvent.click(screen.getByRole('button', { name: 'Open board' }))
    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(open).toHaveBeenCalled()
    expect(onClose).toHaveBeenCalled()
  })
})
