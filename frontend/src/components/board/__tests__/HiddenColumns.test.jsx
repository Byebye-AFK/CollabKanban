import React from 'react'
import { describe, test, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import HiddenColumns from '../HiddenColumns'

const columns = [
  { columnId: 4, name: 'Done', cards: [{ cardId: 1 }, { cardId: 2 }] },
  { columnId: 5, name: 'Canceled', cards: [] },
]

/** A drop carrying the payload TaskCard puts on the drag. */
const dropOn = (node, payload) => {
  fireEvent.drop(node, {
    dataTransfer: { getData: () => (typeof payload === 'string' ? payload : JSON.stringify(payload)) },
  })
}

describe('HiddenColumns', () => {
  test('renders nothing when no column is hidden', () => {
    const { container } = render(<HiddenColumns columns={[]} />)

    expect(container).toBeEmptyDOMElement()
  })

  test('lists each hidden column with its card count', () => {
    render(<HiddenColumns columns={columns} />)

    const done = screen.getByRole('listitem', { name: 'Done, 2 cards' })
    expect(done).toBeInTheDocument()
    expect(screen.getByRole('listitem', { name: 'Canceled, 0 cards' })).toBeInTheDocument()
  })

  test('shows a column again from its row', async () => {
    const onShow = vi.fn()
    render(<HiddenColumns columns={columns} onShow={onShow} />)

    await userEvent.click(screen.getByRole('button', { name: 'Show Done' }))

    expect(onShow).toHaveBeenCalledWith(4)
  })

  test('folds the list away from its heading', async () => {
    render(<HiddenColumns columns={columns} />)

    await userEvent.click(screen.getByRole('button', { name: /Hidden columns/ }))

    expect(screen.queryByRole('listitem', { name: 'Done, 2 cards' })).not.toBeInTheDocument()
  })

  test('moves a dropped card to the end of the hidden column', () => {
    const onMoveCard = vi.fn()
    render(<HiddenColumns columns={columns} onMoveCard={onMoveCard} />)

    dropOn(screen.getByRole('listitem', { name: 'Done, 2 cards' }), { cardId: 9, sourceColumnId: 1 })

    expect(onMoveCard).toHaveBeenCalledWith(9, 1, 4, 2)
  })

  test('ignores a drop that carries no card', () => {
    const onMoveCard = vi.fn()
    render(<HiddenColumns columns={columns} onMoveCard={onMoveCard} />)

    dropOn(screen.getByRole('listitem', { name: 'Done, 2 cards' }), 'not json')

    expect(onMoveCard).not.toHaveBeenCalled()
  })
})
