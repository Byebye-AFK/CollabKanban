import React from 'react'
import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LibraryToolbar from '../LibraryToolbar'

const SORTS = [
  { id: 'name', label: 'Name (A–Z)' },
  { id: 'cards', label: 'Most cards' },
]

const setup = (overrides = {}) => {
  const props = {
    title: 'All boards',
    noun: 'board',
    flatLabel: 'All boards',
    count: 8,
    total: 8,
    sorts: SORTS,
    sort: 'name',
    onSortChange: vi.fn(),
    view: 'grouped',
    onViewChange: vi.fn(),
    ...overrides,
  }
  render(<LibraryToolbar {...props} />)
  return props
}

describe('LibraryToolbar', () => {
  test('reports the count and the active sort', () => {
    setup()

    expect(screen.getByText(/8 boards/)).toBeInTheDocument()
    expect(screen.getByText(/sorted by name \(a–z\)/i)).toBeInTheDocument()
  })

  test('says how many of the total are showing once filtered', () => {
    setup({ count: 2 })

    expect(screen.getByText(/2 of 8 boards/)).toBeInTheDocument()
  })

  test('uses the singular for a lone item', () => {
    setup({ count: 1, total: 1 })

    expect(screen.getByText(/1 board /)).toBeInTheDocument()
  })

  test('takes its wording from the noun it is given', () => {
    setup({ title: 'All teams', noun: 'team', flatLabel: 'All teams', total: 3, count: 3 })

    expect(screen.getByRole('heading', { name: 'All teams' })).toBeInTheDocument()
    expect(screen.getByText(/3 teams/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sort teams' })).toBeInTheDocument()
  })

  test('marks the active view as pressed', () => {
    setup({ view: 'flat' })

    expect(screen.getByRole('button', { name: 'All boards' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Grouped' })).toHaveAttribute('aria-pressed', 'false')
  })

  test('reports a view change', async () => {
    const { onViewChange } = setup()

    await userEvent.click(screen.getByRole('button', { name: 'All boards' }))

    expect(onViewChange).toHaveBeenCalledWith('flat')
  })

  test('keeps the sort menu closed until asked', () => {
    setup()

    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  test('opens the sort menu and reports the chosen sort', async () => {
    const { onSortChange } = setup()

    await userEvent.click(screen.getByRole('button', { name: 'Sort boards' }))
    expect(screen.getByRole('menu')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('menuitem', { name: /Most cards/ }))

    expect(onSortChange).toHaveBeenCalledWith('cards')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  test('closes the sort menu on a click elsewhere', async () => {
    setup()

    await userEvent.click(screen.getByRole('button', { name: 'Sort boards' }))
    await userEvent.click(document.body)

    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  test('closes the sort menu on Escape', async () => {
    setup()

    await userEvent.click(screen.getByRole('button', { name: 'Sort boards' }))
    await userEvent.keyboard('{Escape}')

    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })
})
