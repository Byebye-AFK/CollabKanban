import { useEffect } from 'react'

/**
 * Closes a popover on Escape or on a press outside `ref`.
 *
 * A menu that survives a click elsewhere on the page reads as stuck, so
 * every popover wants exactly this; it listens only while `isOpen`.
 */
export function useDismiss(ref, isOpen, onDismiss) {
  useEffect(() => {
    if (!isOpen) return undefined
    const onPointerDown = (e) => {
      if (!ref.current?.contains(e.target)) onDismiss()
    }
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onDismiss()
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [ref, isOpen, onDismiss])
}
