import React from 'react'
import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TeamCard from '../TeamCard'

const team = (overrides = {}) => ({
  id: 't1',
  name: 'Design',
  workspaceName: 'Product Core',
  workspaceId: 1,
  memberCount: 4,
  role: 'OWNER',
  ...overrides,
})

describe('TeamCard', () => {
  test('names the team and the workspace it belongs to', () => {
    render(<TeamCard team={team()} largest={6} />)

    expect(screen.getByRole('heading', { name: 'Design' })).toBeInTheDocument()
    expect(screen.getByText('Product Core')).toBeInTheDocument()
  })

  test('shows the member count with a pluralised label', () => {
    render(<TeamCard team={team()} largest={6} />)

    expect(screen.getByText('4')).toBeInTheDocument()
    expect(screen.getByText('members')).toBeInTheDocument()
  })

  test('uses the singular for a one-person team', () => {
    render(<TeamCard team={team({ memberCount: 1 })} largest={6} />)

    expect(screen.getByText('member')).toBeInTheDocument()
  })

  test('describes itself in full for assistive technology', () => {
    render(<TeamCard team={team()} largest={6} />)

    expect(screen.getByLabelText('Design in Product Core, 4 members')).toBeInTheDocument()
  })

  test('says when a team has no members yet', () => {
    render(<TeamCard team={team({ memberCount: 0 })} largest={6} />)

    expect(screen.getByLabelText(/No members yet/)).toBeInTheDocument()
  })

  test('scales the meter against the largest team, not against 100', () => {
    const { container } = render(<TeamCard team={team({ memberCount: 3 })} largest={6} />)

    expect(container.querySelector('.tms-meter i').style.getPropertyValue('--w')).toBe('50%')
  })

  test('shows an empty meter for a team with no members', () => {
    const { container } = render(<TeamCard team={team({ memberCount: 0 })} largest={6} />)

    expect(container.querySelector('.tms-meter i').style.getPropertyValue('--w')).toBe('0%')
  })

  test('shows the role the user holds in the workspace', () => {
    render(<TeamCard team={team({ role: 'ADMIN' })} largest={6} />)

    expect(screen.getByText('admin')).toBeInTheDocument()
  })

  test('offers no add button unless the page passes a handler', () => {
    render(<TeamCard team={team()} largest={6} />)

    expect(screen.queryByRole('button', { name: /Add members/ })).not.toBeInTheDocument()
  })

  test('calls back with the team when add members is clicked', async () => {
    const onAddMembers = vi.fn()
    const t = team()
    render(<TeamCard team={t} largest={6} onAddMembers={onAddMembers} />)

    await userEvent.click(screen.getByRole('button', { name: 'Add members to Design' }))

    expect(onAddMembers).toHaveBeenCalledWith(t)
  })
})
