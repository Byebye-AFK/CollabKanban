import React from 'react'
import { describe, test, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CreateTeamModal from '../CreateTeamModal'

const growth = { workspaceId: 2, name: 'Growth Lab' }
const core = { workspaceId: 1, name: 'Product Core' }

describe('CreateTeamModal', () => {
  test('keeps create disabled until a name is typed', async () => {
    render(<CreateTeamModal workspaces={[growth, core]} onSubmit={vi.fn()} onClose={vi.fn()} />)
    const submit = screen.getByRole('button', { name: 'Create team' })

    expect(submit).toBeDisabled()
    await userEvent.type(screen.getByLabelText('Team name'), '   ')
    expect(submit).toBeDisabled()
    await userEvent.type(screen.getByLabelText('Team name'), 'Design')
    expect(submit).toBeEnabled()
  })

  test('defaults to the first workspace and submits the picked one', async () => {
    const onSubmit = vi.fn().mockResolvedValue({})
    const onClose = vi.fn()
    render(<CreateTeamModal workspaces={[growth, core]} onSubmit={onSubmit} onClose={onClose} />)

    expect(screen.getByLabelText('Workspace')).toHaveValue('2')
    await userEvent.type(screen.getByLabelText('Team name'), 'Design')
    await userEvent.selectOptions(screen.getByLabelText('Workspace'), 'Product Core')
    await userEvent.click(screen.getByRole('button', { name: 'Create team' }))

    expect(onSubmit).toHaveBeenCalledWith({ name: 'Design', workspaceId: 1 })
    await waitFor(() => expect(onClose).toHaveBeenCalled())
  })

  test('preselects the given workspace', () => {
    render(
      <CreateTeamModal workspaces={[growth, core]} initialWorkspaceId={1} onSubmit={vi.fn()} onClose={vi.fn()} />,
    )

    expect(screen.getByLabelText('Workspace')).toHaveValue('1')
  })

  test('submits on Enter from the name field', async () => {
    const onSubmit = vi.fn().mockResolvedValue({})
    render(<CreateTeamModal workspaces={[core]} onSubmit={onSubmit} onClose={vi.fn()} />)

    await userEvent.type(screen.getByLabelText('Team name'), 'Design{Enter}')

    expect(onSubmit).toHaveBeenCalledWith({ name: 'Design', workspaceId: 1 })
  })

  test('stays open and shows the error when creation fails', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error('Workspace is Not found'))
    const onClose = vi.fn()
    render(<CreateTeamModal workspaces={[core]} onSubmit={onSubmit} onClose={onClose} />)

    await userEvent.type(screen.getByLabelText('Team name'), 'Design')
    await userEvent.click(screen.getByRole('button', { name: 'Create team' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Workspace is Not found')
    expect(onClose).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Create team' })).toBeEnabled()
  })

  test('closes on Escape and on Cancel', async () => {
    const onClose = vi.fn()
    render(<CreateTeamModal workspaces={[core]} onSubmit={vi.fn()} onClose={onClose} />)

    await userEvent.keyboard('{Escape}')
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(onClose).toHaveBeenCalledTimes(2)
  })
})
