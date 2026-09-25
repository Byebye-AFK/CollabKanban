import React from 'react'
import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const getDashboard = vi.fn()
const getRecent = vi.fn(() => [])

vi.mock('../../api/dashboardApi', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, getDashboard: (...a) => getDashboard(...a), getRecent: (...a) => getRecent(...a) }
})

import StarredPage from '../StarredPage'
import { STARRED_KEY } from '../../api/starredApi'

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

/** Puts the page in its loaded state with the given boards starred. */
function renderStarred(starredIds = []) {
  localStorage.setItem(STARRED_KEY, JSON.stringify(starredIds))
  getDashboard.mockResolvedValue({ workspaces: [workspace], stats: {}, live: true })
  return render(<StarredPage user={{ name: 'Swathesh' }} />)
}

beforeEach(() => {
  localStorage.clear()
  getDashboard.mockReset()
  getRecent.mockReset().mockReturnValue([])
})

describe('StarredPage', () => {
  test('shows only the boards that are starred', async () => {
    renderStarred([1])

    expect(await screen.findByText('Sprint 24')).toBeInTheDocument()
    expect(screen.queryByText('Roadmap')).not.toBeInTheDocument()
  })

  test('explains itself when nothing has been starred', async () => {
    renderStarred([])

    expect(await screen.findByText(/No starred boards yet/i)).toBeInTheDocument()
  })

  test('drops a board off the page as soon as it is unstarred', async () => {
    const user = userEvent.setup()
    renderStarred([1])
    await screen.findByText('Sprint 24')

    await user.click(screen.getByRole('button', { name: 'Unstar Sprint 24' }))

    await waitFor(() => expect(screen.queryByText('Sprint 24')).not.toBeInTheDocument())
  })

  test('persists an unstar so it survives a remount', async () => {
    const user = userEvent.setup()
    renderStarred([1])
    await screen.findByText('Sprint 24')

    await user.click(screen.getByRole('button', { name: 'Unstar Sprint 24' }))

    await waitFor(() => expect(JSON.parse(localStorage.getItem(STARRED_KEY))).toEqual([]))
  })

  test('marks a starred board as pressed for assistive tech', async () => {
    renderStarred([1])

    const star = await screen.findByRole('button', { name: 'Unstar Sprint 24' })
    expect(star).toHaveAttribute('aria-pressed', 'true')
  })
})
