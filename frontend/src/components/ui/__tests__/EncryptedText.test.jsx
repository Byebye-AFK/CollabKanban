import React from 'react'
import { describe, test, expect, vi, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import EncryptedText, { scrambleFrame } from '../EncryptedText'

const visibleText = (container) =>
  [...container.querySelectorAll('[aria-hidden="true"] > span')].map(s => s.textContent).join('')

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('scrambleFrame', () => {
  test('keeps revealed characters and replaces the rest from the charset', () => {
    const frame = scrambleFrame('abcd', 2, 'XY', () => 0)

    expect(frame.map(f => f.char).join('')).toBe('abXX')
    expect(frame.map(f => f.isRevealed)).toEqual([true, true, false, false])
  })

  test('never scrambles spaces', () => {
    const frame = scrambleFrame('a b', 0, 'X', () => 0)

    expect(frame[1]).toEqual({ char: ' ', isRevealed: true })
  })

  test('shows the full text once everything is revealed', () => {
    const frame = scrambleFrame('hello', 5, 'X')

    expect(frame.map(f => f.char).join('')).toBe('hello')
  })

  test('counts characters, not UTF-16 units', () => {
    expect(scrambleFrame('a😀b', 3).map(f => f.char)).toEqual(['a', '😀', 'b'])
  })
})

describe('EncryptedText', () => {
  test('starts scrambled, resolves to the real text, and then stops ticking', () => {
    vi.useFakeTimers()
    const { container } = render(<EncryptedText text="Good afternoon, balu" />)
    expect(visibleText(container)).not.toBe('Good afternoon, balu')
    expect(visibleText(container)).toHaveLength('Good afternoon, balu'.length)

    act(() => { vi.advanceTimersByTime(50 * 20 + 100) })

    expect(visibleText(container)).toBe('Good afternoon, balu')
    expect(vi.getTimerCount()).toBe(0)
  })

  test('reveals left to right', () => {
    vi.useFakeTimers()
    const { container } = render(<EncryptedText text="abcdefghij" revealDelayMs={100} />)

    act(() => { vi.advanceTimersByTime(300) })

    expect(visibleText(container).startsWith('abc')).toBe(true)
  })

  test('exposes the real text to screen readers from the first frame', () => {
    render(<EncryptedText text="Good afternoon, balu" />)

    expect(screen.getByText('Good afternoon, balu')).toHaveClass('sr-only')
  })

  test('renders plain text when animate is false', () => {
    const { container } = render(<EncryptedText text="Hello there" animate={false} />)

    expect(container).toHaveTextContent('Hello there')
    expect(container.querySelector('[aria-hidden]')).toBeNull()
  })

  test('renders plain text when the user prefers reduced motion', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }))
    const { container } = render(<EncryptedText text="Hello there" />)

    expect(container.querySelector('[aria-hidden]')).toBeNull()
    expect(container).toHaveTextContent('Hello there')
  })

  test('applies the encrypted and revealed class names to the right glyphs', () => {
    vi.useFakeTimers()
    const { container } = render(
      <EncryptedText text="ab" revealDelayMs={100} encryptedClassName="is-noise" revealedClassName="is-real" />,
    )
    expect(container.querySelectorAll('.is-noise')).toHaveLength(2)

    act(() => { vi.advanceTimersByTime(250) })

    expect(container.querySelectorAll('.is-real')).toHaveLength(2)
    expect(container.querySelectorAll('.is-noise')).toHaveLength(0)
  })
})
