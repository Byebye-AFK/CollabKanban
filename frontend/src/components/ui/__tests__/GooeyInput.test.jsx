import React, { useState } from 'react'
import { describe, test, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import GooeyInput from '../GooeyInput'

function Harness(props) {
  const [value, setValue] = useState(props.initial ?? '')
  return <GooeyInput value={value} onChange={setValue} label="Search boards" {...props} />
}

const root = () => document.querySelector('.gooey-input')

describe('GooeyInput', () => {
  test('starts collapsed and opens when the field gains focus', async () => {
    render(<Harness />)
    expect(root()).not.toHaveClass('is-open')

    await userEvent.click(screen.getByRole('button', { name: 'Search boards' }))

    expect(root()).toHaveClass('is-open')
    expect(screen.getByRole('textbox', { name: 'Search boards' })).toHaveFocus()
  })

  test('stays open on blur while it holds a value', async () => {
    render(<Harness initial="road" />)
    expect(root()).toHaveClass('is-open')

    await userEvent.click(screen.getByRole('textbox', { name: 'Search boards' }))
    await userEvent.tab()
    await userEvent.tab()

    expect(root()).toHaveClass('is-open')
  })

  test('collapses again on blur when empty', async () => {
    render(<Harness />)
    await userEvent.click(screen.getByRole('textbox', { name: 'Search boards' }))
    expect(root()).toHaveClass('is-open')

    await userEvent.tab()

    expect(root()).not.toHaveClass('is-open')
  })

  test('Escape clears a value, then a second Escape closes the field', async () => {
    render(<Harness initial="road" />)
    const input = screen.getByRole('textbox', { name: 'Search boards' })
    await userEvent.click(input)

    await userEvent.keyboard('{Escape}')
    expect(input).toHaveValue('')
    expect(input).toHaveFocus()

    await userEvent.keyboard('{Escape}')
    expect(input).not.toHaveFocus()
    expect(root()).not.toHaveClass('is-open')
  })

  test('the clear button empties the field and keeps focus', async () => {
    render(<Harness initial="road" />)

    await userEvent.click(screen.getByRole('button', { name: 'Clear search' }))

    expect(screen.getByRole('textbox', { name: 'Search boards' })).toHaveValue('')
    expect(screen.getByRole('textbox', { name: 'Search boards' })).toHaveFocus()
  })

  test('⌘K focuses the field only when hotkey is set', () => {
    const { unmount } = render(<Harness hotkey />)
    fireEvent.keyDown(window, { key: 'k', metaKey: true })
    expect(screen.getByRole('textbox', { name: 'Search boards' })).toHaveFocus()
    expect(screen.getByText('⌘K')).toBeInTheDocument()
    unmount()

    render(<Harness />)
    fireEvent.keyDown(window, { key: 'k', metaKey: true })
    expect(screen.getByRole('textbox', { name: 'Search boards' })).not.toHaveFocus()
  })

  test('uses the anchor to pick the growth direction and a searchbox role for type=search', () => {
    render(<Harness anchor="start" type="search" />)
    expect(root()).toHaveClass('is-start')
    expect(screen.getByRole('searchbox', { name: 'Search boards' })).toBeInTheDocument()
  })

  test('gives each instance its own filter id', () => {
    render(<><Harness /><Harness /></>)
    const ids = [...document.querySelectorAll('filter')].map(f => f.id)
    expect(new Set(ids).size).toBe(2)
  })
})
