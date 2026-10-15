import React from 'react'
import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DisplayMenu from '../DisplayMenu'

const display = { showDescriptions: true, showEmptyColumns: false }

describe('DisplayMenu', () => {
  test('keeps its options closed until asked', () => {
    render(<DisplayMenu display={display} onChange={vi.fn()} />)

    expect(screen.queryByRole('checkbox', { name: 'Show descriptions' })).not.toBeInTheDocument()
  })

  test('reflects the current options once opened', async () => {
    render(<DisplayMenu display={display} onChange={vi.fn()} />)

    await userEvent.click(screen.getByRole('button', { name: 'Display' }))

    expect(screen.getByRole('checkbox', { name: 'Show descriptions' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Show empty columns' })).not.toBeChecked()
  })

  test('reports a flipped option', async () => {
    const onChange = vi.fn()
    render(<DisplayMenu display={display} onChange={onChange} />)

    await userEvent.click(screen.getByRole('button', { name: 'Display' }))
    await userEvent.click(screen.getByRole('checkbox', { name: 'Show empty columns' }))

    expect(onChange).toHaveBeenCalledWith({ showEmptyColumns: true })
  })

  test('closes on Escape', async () => {
    render(<DisplayMenu display={display} onChange={vi.fn()} />)

    await userEvent.click(screen.getByRole('button', { name: 'Display' }))
    await userEvent.keyboard('{Escape}')

    expect(screen.queryByRole('checkbox', { name: 'Show descriptions' })).not.toBeInTheDocument()
  })

  test('closes on a click elsewhere', async () => {
    render(<><DisplayMenu display={display} onChange={vi.fn()} /><p>outside</p></>)

    await userEvent.click(screen.getByRole('button', { name: 'Display' }))
    await userEvent.click(screen.getByText('outside'))

    expect(screen.queryByRole('checkbox', { name: 'Show descriptions' })).not.toBeInTheDocument()
  })
})
