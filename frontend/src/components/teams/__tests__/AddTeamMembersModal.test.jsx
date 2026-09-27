import React from 'react'
import { describe, test, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AddTeamMembersModal from '../AddTeamMembersModal'

const sara = { userId: 11, name: 'Sara Nolan', email: 'sara@example.com' }
const dan = { userId: 12, name: 'Dan Kite', email: 'dan@example.com' }
const aria = { userId: 13, name: 'Aria Patel', email: 'aria@example.com' }

const team = (overrides = {}) => ({
  id: 3,
  name: 'Design',
  workspaceName: 'Product Core',
  members: [sara],
  workspacePeople: [sara, dan, aria],
  ...overrides,
})

describe('AddTeamMembersModal', () => {
  test('lists only workspace people who are not on the team yet', () => {
    render(<AddTeamMembersModal team={team()} onSubmit={vi.fn()} onClose={vi.fn()} />)

    expect(screen.getByRole('checkbox', { name: /Dan Kite/ })).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /Aria Patel/ })).toBeInTheDocument()
    expect(screen.queryByRole('checkbox', { name: /Sara Nolan/ })).not.toBeInTheDocument()
  })

  test('keeps the submit button disabled until someone is picked', async () => {
    render(<AddTeamMembersModal team={team()} onSubmit={vi.fn()} onClose={vi.fn()} />)
    const submit = screen.getByRole('button', { name: /^Add/ })

    expect(submit).toBeDisabled()
    await userEvent.click(screen.getByRole('checkbox', { name: /Dan Kite/ }))
    expect(submit).toBeEnabled()
    expect(submit).toHaveTextContent('Add 1 member')
  })

  test('submits the picked ids and closes when all succeed', async () => {
    const onSubmit = vi.fn().mockResolvedValue({ added: [12, 13], failed: [] })
    const onClose = vi.fn()
    render(<AddTeamMembersModal team={team()} onSubmit={onSubmit} onClose={onClose} />)

    await userEvent.click(screen.getByRole('checkbox', { name: /Dan Kite/ }))
    await userEvent.click(screen.getByRole('checkbox', { name: /Aria Patel/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Add 2 members' }))

    expect(onSubmit).toHaveBeenCalledWith([13, 12])
    await waitFor(() => expect(onClose).toHaveBeenCalled())
  })

  test('stays open and names who failed, keeping only them selected', async () => {
    const onSubmit = vi.fn().mockResolvedValue({
      added: [13],
      failed: [{ userId: 12, message: 'Dan Kite is already on Design' }],
    })
    const onClose = vi.fn()
    render(<AddTeamMembersModal team={team()} onSubmit={onSubmit} onClose={onClose} />)

    await userEvent.click(screen.getByRole('checkbox', { name: /Dan Kite/ }))
    await userEvent.click(screen.getByRole('checkbox', { name: /Aria Patel/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Add 2 members' }))

    expect(await screen.findByText(/Dan Kite is already on Design/)).toBeInTheDocument()
    expect(onClose).not.toHaveBeenCalled()
    expect(screen.getByRole('checkbox', { name: /Dan Kite/ })).toBeChecked()
    expect(screen.queryByRole('checkbox', { name: /Aria Patel/ })).not.toBeInTheDocument()
  })

  test('says so when everyone in the workspace is already on the team', () => {
    render(
      <AddTeamMembersModal team={team({ workspacePeople: [sara] })} onSubmit={vi.fn()} onClose={vi.fn()} />,
    )

    expect(screen.getByText(/Everyone in Product Core is already on Design/)).toBeInTheDocument()
  })

  test('narrows the list from the search field', async () => {
    render(<AddTeamMembersModal team={team()} onSubmit={vi.fn()} onClose={vi.fn()} />)

    await userEvent.type(screen.getByRole('searchbox', { name: 'Filter people' }), 'aria')

    expect(screen.getByRole('checkbox', { name: /Aria Patel/ })).toBeInTheDocument()
    expect(screen.queryByRole('checkbox', { name: /Dan Kite/ })).not.toBeInTheDocument()
  })

  test('closes on Escape', async () => {
    const onClose = vi.fn()
    render(<AddTeamMembersModal team={team()} onSubmit={vi.fn()} onClose={onClose} />)

    await userEvent.keyboard('{Escape}')

    expect(onClose).toHaveBeenCalled()
  })
})
