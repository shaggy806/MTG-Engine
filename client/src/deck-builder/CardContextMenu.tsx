import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

export interface MenuItem {
  readonly label: string
  readonly onSelect: () => void
  readonly disabled?: boolean
  /** Draw a divider above this item. */
  readonly separated?: boolean
}

export interface MenuAnchor {
  /** Viewport coordinates of the right-click. */
  readonly x: number
  readonly y: number
  readonly title: string
  readonly items: readonly MenuItem[]
}

const MARGIN = 6

/**
 * The deck builder's right-click menu on a card row.
 *
 * Portalled to `document.body` and positioned from JS, for the same reason
 * `CardHoverPreview` is: the card lists it hangs off are scroll boxes, so an
 * absolutely-positioned child would be clipped by `overflow`. Its size isn't
 * known until it's rendered (the items differ per row), so it's measured
 * after layout and nudged back on screen, rather than guessed at from a
 * constant the way the fixed-size hover preview can afford to.
 */
export function CardContextMenu({
  anchor,
  onClose,
}: {
  readonly anchor: MenuAnchor | null
  readonly onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (anchor === null || el === null) {
      setPos(null)
      return
    }
    const { width, height } = el.getBoundingClientRect()
    setPos({
      left: Math.max(MARGIN, Math.min(anchor.x, window.innerWidth - width - MARGIN)),
      top: Math.max(MARGIN, Math.min(anchor.y, window.innerHeight - height - MARGIN)),
    })
  }, [anchor])

  useEffect(() => {
    if (anchor === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    // Whether the press was inside is decided here, by containment, rather
    // than by a `stopPropagation` in the menu's own React handler: React
    // listens at its root, so this capture-phase listener has already run
    // and closed the menu by then — which unmounted the button before its
    // click could land, and every menu item silently did nothing.
    const onPointerDown = (e: PointerEvent) => {
      if (ref.current?.contains(e.target as Node)) return
      onClose()
    }
    // `scroll` in capture, since it doesn't bubble: the menu is placed in
    // viewport coordinates, so a scrolled list leaves it pointing at nothing.
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onPointerDown, true)
    window.addEventListener('scroll', onClose, true)
    window.addEventListener('resize', onClose)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', onPointerDown, true)
      window.removeEventListener('scroll', onClose, true)
      window.removeEventListener('resize', onClose)
    }
  }, [anchor, onClose])

  if (anchor === null) return null

  return createPortal(
    <div
      className="db-context-menu"
      ref={ref}
      role="menu"
      // Rendered off-screen for the one frame before it's been measured, so
      // it never flashes at the wrong place.
      style={pos === null ? { left: -9999, top: -9999 } : pos}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="db-context-title">{anchor.title}</div>
      {anchor.items.map((item) => (
        <button
          key={item.label}
          type="button"
          role="menuitem"
          className={item.separated ? 'separated' : undefined}
          disabled={item.disabled}
          onClick={() => {
            item.onSelect()
            onClose()
          }}
        >
          {item.label}
        </button>
      ))}
    </div>,
    document.body,
  )
}
