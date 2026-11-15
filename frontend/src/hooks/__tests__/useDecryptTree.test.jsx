import React, { useRef, useState } from 'react'
import { describe, test, expect, vi, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { useDecryptTree, revealedCountAt } from '../useDecryptTree'

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

function Region({ active = true, children }) {
  const ref = useRef(null)
  useDecryptTree(ref, active)
  return <div ref={ref} data-testid="region">{children}</div>
}

const REAL = 'Product Core'

describe('revealedCountAt', () => {
  test('reveals a short string at the base rate', () => {
    expect(revealedCountAt(90, 10)).toBe(3)
  })

  test('finishes a long string within the cap instead of crawling', () => {
    expect(revealedCountAt(1200, 400)).toBeGreaterThanOrEqual(400)
  })

  test('reveals nothing for an empty string', () => {
    expect(revealedCountAt(500, 0)).toBe(0)
  })
})

describe('useDecryptTree', () => {
  test('scrambles text before the first paint and marks the region busy', () => {
    vi.useFakeTimers()
    render(<Region><p>{REAL}</p></Region>)

    expect(screen.getByTestId('region').textContent).not.toBe(REAL)
    expect(screen.getByTestId('region').textContent).toHaveLength(REAL.length)
    expect(screen.getByTestId('region')).toHaveAttribute('aria-busy', 'true')
  })

  test('resolves every text node back to the real text and stops ticking', () => {
    vi.useFakeTimers()
    render(<Region><h2>{REAL}</h2><p>Growth Lab</p></Region>)

    act(() => { vi.advanceTimersByTime(2000) })

    expect(screen.getByText(REAL)).toBeInTheDocument()
    expect(screen.getByText('Growth Lab')).toBeInTheDocument()
    expect(screen.getByTestId('region')).not.toHaveAttribute('aria-busy')
    expect(vi.getTimerCount()).toBe(0)
  })

  test('keeps whitespace and element structure intact', () => {
    vi.useFakeTimers()
    render(<Region><ul><li>One two</li></ul></Region>)

    expect(screen.getByTestId('region').querySelector('li').textContent[3]).toBe(' ')
    act(() => { vi.advanceTimersByTime(2000) })
    expect(screen.getByTestId('region').querySelectorAll('li')).toHaveLength(1)
  })

  test('leaves elements marked data-no-decrypt alone', () => {
    vi.useFakeTimers()
    render(<Region><h1 data-no-decrypt>Hello</h1><p>{REAL}</p></Region>)

    expect(screen.getByText('Hello')).toBeInTheDocument()
    expect(screen.getByTestId('region').textContent).not.toContain(REAL)
  })

  test('does nothing while inactive, then runs when it turns active', () => {
    vi.useFakeTimers()
    function Toggle() {
      const [active, setActive] = useState(false)
      return (
        <>
          <button onClick={() => setActive(true)}>go</button>
          <Region active={active}><p>{REAL}</p></Region>
        </>
      )
    }
    render(<Toggle />)
    expect(screen.getByText(REAL)).toBeInTheDocument()

    act(() => { screen.getByText('go').click() })

    expect(screen.queryByText(REAL)).not.toBeInTheDocument()
    act(() => { vi.advanceTimersByTime(2000) })
    expect(screen.getByText(REAL)).toBeInTheDocument()
  })

  test('does not overwrite text React changed mid-animation', () => {
    vi.useFakeTimers()
    function Live() {
      const [label, setLabel] = useState(REAL)
      return (
        <>
          <button onClick={() => setLabel('Changed live')}>change</button>
          <Region><p>{label}</p></Region>
        </>
      )
    }
    render(<Live />)

    act(() => { screen.getByText('change').click() })
    act(() => { vi.advanceTimersByTime(2000) })

    expect(screen.getByText('Changed live')).toBeInTheDocument()
  })

  test('restores the real text when unmounted mid-animation', () => {
    vi.useFakeTimers()
    const { unmount } = render(<Region><p>{REAL}</p></Region>)
    const node = screen.getByTestId('region').querySelector('p')
    expect(node.textContent).not.toBe(REAL)

    unmount()

    expect(node.textContent).toBe(REAL)
  })

  test('leaves the text alone when the user prefers reduced motion', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }))
    render(<Region><p>{REAL}</p></Region>)

    expect(screen.getByText(REAL)).toBeInTheDocument()
    expect(screen.getByTestId('region')).not.toHaveAttribute('aria-busy')
  })
})
