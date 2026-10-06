import { useEffect } from 'react'

/** Calls `onEscape` when Escape is pressed, while `onEscape` is given — how a
 * popup closes from the keyboard, as the Settings and Seat menus always have. */
export function useEscape(onEscape: (() => void) | undefined): void {
  useEffect(() => {
    if (onEscape === undefined) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onEscape()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onEscape])
}
