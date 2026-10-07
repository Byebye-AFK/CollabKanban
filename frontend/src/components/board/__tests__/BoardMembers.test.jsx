import React from 'react'
import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import BoardMembers from '../BoardMembers'

const person = (id, name) => ({ userId: id, name, email: `${name.split(' ')[0].toLowerCase()}@example.com` })

const SARA = person(11, 'Sara Nolan')
const DAN = person(12, 'Dan Kite')
const ARIA = person(13, 'Aria Patel')
const MILES = person(14, 'Miles Fox')
const NINA = person(15, 'Nina Cole')
const LEO = person(16, 'Leo Brand')

const trigger = (name) => screen.getByRole('button', { name })

describe('BoardMembers', () => {
  test('names the team and counts its members on the trigger', () => {
    render(<BoardMembers teamName="Design" members={[SARA, DAN, ARIA]} />)

    expect(trigger('Design team, 3 members')).toBeInTheDocument()
  })

  test('uses the singular for a team of one', () => {
    render(<BoardMembers teamName="Design" members={[SARA]} />)

    expect(trigger('Design team, 1 member')).toBeInTheDocument()
  })

  test('shows initials for each member up to the limit', () => {
    render(<BoardMembers teamName="Design" members={[SARA, DAN]} />)

    expect(screen.getByText('SN')).toBeInTheDocument()
    expect(screen.getByText('DK')).toBeInTheDocument()
  })

  test('collapses the rest into a +N chip', () => {
    render(<BoardMembers teamName="Design" members={[SARA, DAN, ARIA, MILES, NINA, LEO]} />)

    expect(screen.getByText('+2')).toBeInTheDocument()
    expect(screen.queryByText('NC')).not.toBeInTheDocument()
  })

  test('keeps the list closed until asked', () => {
    render(<BoardMembers teamName="Design" members={[SARA]} />)

    expect(screen.queryByText('sara@example.com')).not.toBeInTheDocument()
    expect(trigger('Design team, 1 member')).toHaveAttribute('aria-expanded', 'false')
  })

  test('lists every member with their email once opened', async () => {
    const user = userEvent.setup()
    render(<BoardMembers teamName="Design" members={[SARA, DAN, ARIA, MILES, NINA, LEO]} />)

    await user.click(trigger('Design team, 6 members'))

    expect(screen.getByText('Leo Brand')).toBeInTheDocument()
    expect(screen.getByText('leo@example.com')).toBeInTheDocument()
    expect(trigger('Design team, 6 members')).toHaveAttribute('aria-expanded', 'true')
  })

  test('says so when the team has nobody yet', async () => {
    const user = userEvent.setup()
    render(<BoardMembers teamName="Design" members={[]} />)

    await user.click(trigger('Design team, 0 members'))

    expect(screen.getByText('No members yet.')).toBeInTheDocument()
  })

  test('closes the list on Escape', async () => {
    const user = userEvent.setup()
    render(<BoardMembers teamName="Design" members={[SARA]} />)
    await user.click(trigger('Design team, 1 member'))

    await user.keyboard('{Escape}')

    expect(screen.queryByText('sara@example.com')).not.toBeInTheDocument()
  })

  test('closes the list when clicking elsewhere', async () => {
    const user = userEvent.setup()
    render(
      <div>
        <button>Elsewhere</button>
        <BoardMembers teamName="Design" members={[SARA]} />
      </div>,
    )
    await user.click(trigger('Design team, 1 member'))

    await user.click(screen.getByRole('button', { name: 'Elsewhere' }))

    expect(screen.queryByText('sara@example.com')).not.toBeInTheDocument()
  })

  test('offers Add people only when the caller may add them', () => {
    const { rerender } = render(<BoardMembers teamName="Design" members={[SARA]} />)
    expect(screen.queryByRole('button', { name: 'Add people' })).not.toBeInTheDocument()

    rerender(<BoardMembers teamName="Design" members={[SARA]} onAddPeople={() => {}} />)
    expect(screen.getByRole('button', { name: 'Add people' })).toBeInTheDocument()
  })

  test('calls back when Add people is clicked', async () => {
    const user = userEvent.setup()
    const onAddPeople = vi.fn()
    render(<BoardMembers teamName="Design" members={[SARA]} onAddPeople={onAddPeople} />)

    await user.click(screen.getByRole('button', { name: 'Add people' }))

    expect(onAddPeople).toHaveBeenCalledTimes(1)
  })
})
