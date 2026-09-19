import React from 'react'
import { describe, test, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LibraryGrid from '../LibraryGrid'

const make = (id, name, workspaceId, workspaceName) => ({
  id, name, workspaceId, workspaceName,
})

const items = [
  make(1, 'Sprint 24', 1, 'Product Core'),
  make(2, 'Roadmap', 1, 'Product Core'),
  make(3, 'Q3 Campaigns', 2, 'Growth Lab'),
]

const renderItem = (item, index, key) => (
  <article key={key} data-testid="item" data-index={index}>
    <h4>{item.name}</h4>
  </article>
)

const setup = (view, extra = {}) =>
  render(
    <LibraryGrid
      items={items}
      view={view}
      noun="board"
      getKey={i => i.id}
      renderItem={renderItem}
      {...extra}
    />,
  )

describe('LibraryGrid — flat view', () => {
  test('renders every item with no workspace headings', () => {
    setup('flat')

    expect(screen.getAllByTestId('item')).toHaveLength(3)
    expect(screen.queryAllByRole('heading', { level: 3 })).toHaveLength(0)
  })

  test('staggers each item by its position', () => {
    setup('flat')

    expect(screen.getAllByTestId('item').map(n => n.dataset.index)).toEqual(['0', '1', '2'])
  })

  test('renders nothing for an empty list', () => {
    render(<LibraryGrid items={[]} view="flat" noun="board" getKey={i => i.id} renderItem={renderItem} />)

    expect(screen.queryAllByTestId('item')).toHaveLength(0)
  })
})

describe('LibraryGrid — grouped view', () => {
  test('groups items under a heading per workspace', () => {
    setup('grouped')

    expect(screen.getByRole('region', { name: 'Product Core' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Growth Lab' })).toBeInTheDocument()
  })

  test('counts the items in each group, pluralised by the noun', () => {
    setup('grouped')

    expect(within(screen.getByRole('region', { name: 'Product Core' })).getByText('2 boards')).toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: 'Growth Lab' })).getByText('1 board')).toBeInTheDocument()
  })

  test('continues the stagger across group boundaries', () => {
    setup('grouped')

    // Not restarting at 0 in the second group is what makes the page
    // cascade as one motion rather than several.
    expect(screen.getAllByTestId('item').map(n => n.dataset.index)).toEqual(['0', '1', '2'])
  })

  test('starts with every group expanded', () => {
    setup('grouped')

    const head = within(screen.getByRole('region', { name: 'Product Core' }))
      .getByRole('button', { name: /^Product Core/ })
    expect(head).toHaveAttribute('aria-expanded', 'true')
  })

  test('collapses and re-expands a group from its heading', async () => {
    setup('grouped')
    const head = within(screen.getByRole('region', { name: 'Product Core' }))
      .getByRole('button', { name: /^Product Core/ })

    await userEvent.click(head)
    expect(head).toHaveAttribute('aria-expanded', 'false')

    await userEvent.click(head)
    expect(head).toHaveAttribute('aria-expanded', 'true')
  })

  test('collapsing one group leaves the others open', async () => {
    setup('grouped')

    await userEvent.click(
      within(screen.getByRole('region', { name: 'Product Core' }))
        .getByRole('button', { name: /^Product Core/ }),
    )

    expect(
      within(screen.getByRole('region', { name: 'Growth Lab' }))
        .getByRole('button', { name: /^Growth Lab/ }),
    ).toHaveAttribute('aria-expanded', 'true')
  })

  test('renders no groups when given no items', () => {
    render(<LibraryGrid items={[]} view="grouped" noun="team" getKey={i => i.id} renderItem={renderItem} />)

    expect(screen.queryAllByRole('region')).toHaveLength(0)
  })
})
