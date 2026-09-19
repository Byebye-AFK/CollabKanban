import React from 'react'
import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const getDashboard = vi.fn()

vi.mock('../../api/dashboardApi', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, getDashboard: (...a) => getDashboard(...a) }
})

import TeamsPage from '../TeamsPage'

const workspace = {
  workspaceId: 1,
  name: 'Product Core',
  role: 'OWNER',
  members: ['Sara Nolan'],
  teams: [
    { id: 't1', name: 'Design', memberCount: 4 },
    { id: 't2', name: 'Backend', memberCount: 6 },
  ],
  boards: [],
}

beforeEach(() => {
  getDashboard.mockReset()
})

describe('TeamsPage', () => {
  test('shows a skeleton grid while loading', () => {
    getDashboard.mockReturnValue(new Promise(() => {}))
    const { container } = render(<TeamsPage user={{ name: 'Swathesh' }} />)

    expect(container.querySelectorAll('.lib-skeleton').length).toBeGreaterThan(0)
  })

  test('renders every team once loaded', async () => {
    getDashboard.mockResolvedValue({ workspaces: [workspace], stats: {}, live: true })
    render(<TeamsPage user={{ name: 'Swathesh' }} />)

    expect(await screen.findByRole('heading', { name: 'Design' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Backend' })).toBeInTheDocument()
  })

  test('says so when the user has no teams at all', async () => {
    getDashboard.mockResolvedValue({ workspaces: [], stats: {}, live: true })
    render(<TeamsPage user={{ name: 'Swathesh' }} />)

    expect(await screen.findByText(/No teams yet/)).toBeInTheDocument()
  })

  test('warns when it is showing sample data', async () => {
    getDashboard.mockResolvedValue({ workspaces: [workspace], stats: {}, live: false })
    render(<TeamsPage user={{ name: 'Swathesh' }} />)

    expect(await screen.findByText(/Showing sample data/)).toBeInTheDocument()
  })

  test('reports a failure instead of an empty grid', async () => {
    getDashboard.mockRejectedValue(new Error('network'))
    render(<TeamsPage user={{ name: 'Swathesh' }} />)

    expect(await screen.findByText(/Couldn't load your teams/)).toBeInTheDocument()
  })

  test('filters the grid from the top-bar search', async () => {
    getDashboard.mockResolvedValue({ workspaces: [workspace], stats: {}, live: true })
    render(<TeamsPage user={{ name: 'Swathesh' }} />)
    await screen.findByRole('heading', { name: 'Design' })

    await userEvent.type(screen.getByRole('textbox', { name: 'Search teams' }), 'backend')

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Design' })).not.toBeInTheDocument()
    })
    expect(screen.getByRole('heading', { name: 'Backend' })).toBeInTheDocument()
  })

  test('says when a search matches nothing', async () => {
    getDashboard.mockResolvedValue({ workspaces: [workspace], stats: {}, live: true })
    render(<TeamsPage user={{ name: 'Swathesh' }} />)
    await screen.findByRole('heading', { name: 'Design' })

    await userEvent.type(screen.getByRole('textbox', { name: 'Search teams' }), 'zzz')

    expect(await screen.findByText(/No teams match/)).toBeInTheDocument()
  })

  test('reorders the grid when the sort changes', async () => {
    getDashboard.mockResolvedValue({ workspaces: [workspace], stats: {}, live: true })
    const { container } = render(<TeamsPage user={{ name: 'Swathesh' }} />)
    await screen.findByRole('heading', { name: 'Design' })

    const names = () => [...container.querySelectorAll('.lib-name')].map(n => n.textContent)
    expect(names()).toEqual(['Backend', 'Design'])

    await userEvent.click(screen.getByRole('button', { name: 'Sort teams' }))
    await userEvent.click(screen.getByRole('menuitem', { name: /Most members/ }))

    expect(names()).toEqual(['Backend', 'Design'])
    expect(screen.getByText(/sorted by most members/)).toBeInTheDocument()
  })

  test('switches between grouped and flat arrangements', async () => {
    getDashboard.mockResolvedValue({ workspaces: [workspace], stats: {}, live: true })
    const { container } = render(<TeamsPage user={{ name: 'Swathesh' }} />)
    await screen.findByRole('heading', { name: 'Design' })

    expect(screen.getByRole('region', { name: 'Product Core' })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'All teams' }))

    expect(screen.queryByRole('region', { name: 'Product Core' })).not.toBeInTheDocument()
    expect(container.querySelectorAll('.tms-card')).toHaveLength(2)
  })

  test('scales every meter against the largest team, not the visible one', async () => {
    getDashboard.mockResolvedValue({ workspaces: [workspace], stats: {}, live: true })
    const { container } = render(<TeamsPage user={{ name: 'Swathesh' }} />)
    await screen.findByRole('heading', { name: 'Design' })

    // Filtering away the 6-person team must not rescale the 4-person one.
    await userEvent.type(screen.getByRole('textbox', { name: 'Search teams' }), 'design')
    await waitFor(() => expect(container.querySelectorAll('.tms-card')).toHaveLength(1))

    expect(container.querySelector('.tms-meter i').style.getPropertyValue('--w')).toBe('67%')
  })

  test('routes rail clicks for other pages but not its own', async () => {
    getDashboard.mockResolvedValue({ workspaces: [workspace], stats: {}, live: true })
    const onNavigate = vi.fn()
    render(<TeamsPage user={{ name: 'Swathesh' }} onNavigate={onNavigate} />)
    await screen.findByRole('heading', { name: 'Design' })

    const rail = within(screen.getByRole('navigation', { name: 'Primary' }))

    await userEvent.click(rail.getByRole('button', { name: 'Teams' }))
    expect(onNavigate).not.toHaveBeenCalled()

    await userEvent.click(rail.getByRole('button', { name: 'Boards' }))
    expect(onNavigate).toHaveBeenCalledWith('boards')
  })
})
