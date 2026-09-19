import React from 'react'
import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import BoardCard from '../BoardCard'

const board = (overrides = {}) => ({
  boardId: 1,
  name: 'Sprint 24',
  workspaceName: 'Product Core',
  workspace: { workspaceId: 1, name: 'Product Core' },
  members: ['Sara Nolan', 'Dan Kite'],
  progress: { known: true, total: 34, done: 24, columnCount: 3 },
  lastVisitedAt: null,
  ...overrides,
})

describe('BoardCard', () => {
  test('names the board and the workspace it belongs to', () => {
    render(<BoardCard board={board()} />)

    expect(screen.getByRole('heading', { name: 'Sprint 24' })).toBeInTheDocument()
    expect(screen.getByText('Product Core')).toBeInTheDocument()
  })

  test('shows the done ratio when card counts are known', () => {
    render(<BoardCard board={board()} />)

    expect(screen.getByText('24/34 done')).toBeInTheDocument()
  })

  test('shows the completion percentage as an accessible label', () => {
    render(<BoardCard board={board()} />)

    expect(screen.getByRole('img', { name: '71% complete' })).toBeInTheDocument()
  })

  test('falls back to a column count when card counts are unknown', () => {
    render(<BoardCard board={board({
      progress: { known: false, total: 0, done: 0, columnCount: 4 },
    })} />)

    expect(screen.getByText('4 columns')).toBeInTheDocument()
    expect(screen.queryByRole('img', { name: /complete/ })).not.toBeInTheDocument()
  })

  test('says a board has no cards rather than showing an empty ring', () => {
    render(<BoardCard board={board({
      progress: { known: true, total: 0, done: 0, columnCount: 2 },
    })} />)

    expect(screen.getByText('No cards yet')).toBeInTheDocument()
    expect(screen.queryByRole('img', { name: /complete/ })).not.toBeInTheDocument()
  })

  test('says so when a board has no cards and no columns', () => {
    render(<BoardCard board={board({
      progress: { known: false, total: 0, done: 0, columnCount: 0 },
    })} />)

    expect(screen.getByText('No cards yet')).toBeInTheDocument()
  })

  test('collapses a long member list into a +N counter', () => {
    render(<BoardCard board={board({
      members: ['Sara Nolan', 'Dan Kite', 'Aria Patel', 'Miles Fox', 'Leo Brand'],
    })} />)

    expect(screen.getByText('+2')).toBeInTheDocument()
  })

  test('says so when a board has no members', () => {
    render(<BoardCard board={board({ members: [] })} />)

    expect(screen.getByText('No members')).toBeInTheDocument()
  })

  test('shows when the board was last opened', () => {
    render(<BoardCard board={board({ lastVisitedAt: Date.now() - 2 * 60 * 60 * 1000 })} />)

    expect(screen.getByText(/2h ago/)).toBeInTheDocument()
  })

  test('opens the board on click', async () => {
    const onOpen = vi.fn()
    const b = board()
    render(<BoardCard board={b} onOpen={onOpen} />)

    await userEvent.click(screen.getByRole('button', { name: /Open Sprint 24/ }))

    expect(onOpen).toHaveBeenCalledWith(b)
  })

  test('opens the board from the keyboard with Enter and Space', async () => {
    const onOpen = vi.fn()
    render(<BoardCard board={board()} onOpen={onOpen} />)

    const card = screen.getByRole('button', { name: /Open Sprint 24/ })
    card.focus()
    await userEvent.keyboard('{Enter}')
    await userEvent.keyboard(' ')

    expect(onOpen).toHaveBeenCalledTimes(2)
  })

  test('does not throw when no open handler is given', async () => {
    render(<BoardCard board={board()} />)

    await userEvent.click(screen.getByRole('button', { name: /Open Sprint 24/ }))

    expect(screen.getByRole('heading', { name: 'Sprint 24' })).toBeInTheDocument()
  })
})
