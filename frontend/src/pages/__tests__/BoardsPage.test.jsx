import React from 'react'
import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const getDashboard = vi.fn()
const getRecent = vi.fn(() => [])

vi.mock('../../api/dashboardApi', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, getDashboard: (...a) => getDashboard(...a), getRecent: (...a) => getRecent(...a) }
})

// The graph canvas pulls in three.js, which jsdom cannot run — this page
// does not render it, but the shell's rail imports stay cheap this way.
import BoardsPage from '../BoardsPage'

const workspace = {
  workspaceId: 1,
  name: 'Product Core',
  role: 'OWNER',
  members: ['Sara Nolan'],
  teams: [],
  boards: [
    { boardId: 1, name: 'Sprint 24', cards: 34, done: 24 },
    { boardId: 2, name: 'Roadmap', cards: 18, done: 11 },
  ],
}

beforeEach(() => {
  getDashboard.mockReset()
  getRecent.mockReset().mockReturnValue([])
})

describe('BoardsPage', () => {
  test('shows a skeleton grid while loading', () => {
    getDashboard.mockReturnValue(new Promise(() => {}))
    const { container } = render(<BoardsPage user={{ name: 'Swathesh' }} />)

    expect(container.querySelectorAll('.lib-skeleton').length).toBeGreaterThan(0)
  })

  test('renders every board once loaded', async () => {
    getDashboard.mockResolvedValue({ workspaces: [workspace], stats: {}, live: true })
    render(<BoardsPage user={{ name: 'Swathesh' }} />)

    expect(await screen.findByRole('heading', { name: 'Sprint 24' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Roadmap' })).toBeInTheDocument()
  })

  test('says so when the user has no boards at all', async () => {
    getDashboard.mockResolvedValue({ workspaces: [], stats: {}, live: true })
    render(<BoardsPage user={{ name: 'Swathesh' }} />)

    expect(await screen.findByText(/No boards yet/)).toBeInTheDocument()
  })

  test('warns when it is showing sample data', async () => {
    getDashboard.mockResolvedValue({ workspaces: [workspace], stats: {}, live: false })
    render(<BoardsPage user={{ name: 'Swathesh' }} />)

    expect(await screen.findByText(/Showing sample data/)).toBeInTheDocument()
  })

  test('shows no sample-data warning when the data is live', async () => {
    getDashboard.mockResolvedValue({ workspaces: [workspace], stats: {}, live: true })
    render(<BoardsPage user={{ name: 'Swathesh' }} />)

    await screen.findByRole('heading', { name: 'Sprint 24' })
    expect(screen.queryByText(/Showing sample data/)).not.toBeInTheDocument()
  })

  test('reports a failure instead of an empty grid', async () => {
    getDashboard.mockRejectedValue(new Error('network'))
    render(<BoardsPage user={{ name: 'Swathesh' }} />)

    expect(await screen.findByText(/Couldn't load your boards/)).toBeInTheDocument()
  })

  test('filters the grid from the top-bar search', async () => {
    getDashboard.mockResolvedValue({ workspaces: [workspace], stats: {}, live: true })
    render(<BoardsPage user={{ name: 'Swathesh' }} />)
    await screen.findByRole('heading', { name: 'Sprint 24' })

    await userEvent.type(screen.getByRole('textbox', { name: 'Search boards' }), 'roadmap')

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Sprint 24' })).not.toBeInTheDocument()
    })
    expect(screen.getByRole('heading', { name: 'Roadmap' })).toBeInTheDocument()
  })

  test('says when a search matches nothing', async () => {
    getDashboard.mockResolvedValue({ workspaces: [workspace], stats: {}, live: true })
    render(<BoardsPage user={{ name: 'Swathesh' }} />)
    await screen.findByRole('heading', { name: 'Sprint 24' })

    await userEvent.type(screen.getByRole('textbox', { name: 'Search boards' }), 'zzz')

    expect(await screen.findByText(/No boards match/)).toBeInTheDocument()
  })

  test('opens a board with its workspace and name', async () => {
    getDashboard.mockResolvedValue({ workspaces: [workspace], stats: {}, live: true })
    const onOpenBoard = vi.fn()
    render(<BoardsPage user={{ name: 'Swathesh' }} onOpenBoard={onOpenBoard} />)

    await userEvent.click(await screen.findByRole('button', { name: /Open Sprint 24/ }))

    expect(onOpenBoard).toHaveBeenCalledWith(1, workspace, 'Sprint 24')
  })

  test('switches between grouped and flat arrangements', async () => {
    getDashboard.mockResolvedValue({ workspaces: [workspace], stats: {}, live: true })
    const { container } = render(<BoardsPage user={{ name: 'Swathesh' }} />)
    await screen.findByRole('heading', { name: 'Sprint 24' })

    // Grouped is the default, so the workspace region is present.
    expect(screen.getByRole('region', { name: 'Product Core' })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'All boards' }))

    expect(screen.queryByRole('region', { name: 'Product Core' })).not.toBeInTheDocument()
    expect(container.querySelectorAll('.lib-card')).toHaveLength(2)
  })

  test('reorders the grid when the sort changes', async () => {
    getDashboard.mockResolvedValue({ workspaces: [workspace], stats: {}, live: true })
    const { container } = render(<BoardsPage user={{ name: 'Swathesh' }} />)
    await screen.findByRole('heading', { name: 'Sprint 24' })

    const names = () => [...container.querySelectorAll('.lib-name')].map(n => n.textContent)
    expect(names()).toEqual(['Roadmap', 'Sprint 24'])

    await userEvent.click(screen.getByRole('button', { name: 'Sort boards' }))
    await userEvent.click(screen.getByRole('menuitem', { name: /Most cards/ }))

    expect(names()).toEqual(['Sprint 24', 'Roadmap'])
    expect(screen.getByText(/sorted by most cards/)).toBeInTheDocument()
  })

  test('collapses the sidebar from the top bar', async () => {
    getDashboard.mockResolvedValue({ workspaces: [workspace], stats: {}, live: true })
    const { container } = render(<BoardsPage user={{ name: 'Swathesh' }} />)
    await screen.findByRole('heading', { name: 'Sprint 24' })

    expect(container.querySelector('.dsh-rail.is-collapsed')).toBeNull()

    await userEvent.click(screen.getByRole('button', { name: 'Collapse sidebar' }))

    expect(container.querySelector('.dsh-rail.is-collapsed')).toBeInTheDocument()
  })

  test('routes rail clicks for other pages but not its own', async () => {
    getDashboard.mockResolvedValue({ workspaces: [workspace], stats: {}, live: true })
    const onNavigate = vi.fn()
    render(<BoardsPage user={{ name: 'Swathesh' }} onNavigate={onNavigate} />)
    await screen.findByRole('heading', { name: 'Sprint 24' })

    // Scoped to the rail: the top bar also carries a "Dashboard" button.
    const rail = within(screen.getByRole('navigation', { name: 'Primary' }))

    await userEvent.click(rail.getByRole('button', { name: 'Boards' }))
    expect(onNavigate).not.toHaveBeenCalled()

    await userEvent.click(rail.getByRole('button', { name: 'Dashboard' }))
    expect(onNavigate).toHaveBeenCalledWith('dashboard')
  })
})
