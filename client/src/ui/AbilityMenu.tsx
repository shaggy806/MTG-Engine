import { useEffect, useLayoutEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import type { ObjectId } from 'engine'
import { Symbols } from './Symbols.tsx'

/** Breathing room between the tile and the menu, and between the menu and
 * the viewport edge it gets clamped against. */
const GAP = 8

export interface AbilityMenuItem {
  readonly key: string
  /** The ability's rules text; `{…}` tokens render as pips. */
  readonly label: string
  readonly onSelect: () => void
}

/**
 * The activated abilities of one permanent, as a small menu beside the
 * permanent itself.
 *
 * It used to be a bar docked in the hand strip at the bottom of the screen,
 * which meant the thing you clicked and the list of what it could do were at
 * opposite ends of the table — on a 3-4 player board, a tile in a top-row
 * quadrant was the better part of a screen away from its own abilities, and
 * nothing tied the two together but the tile's selected outline.
 *
 * Portalled to `document.body` and placed from JS, for the same reasons
 * `useHoverPopover` documents: a tile lives inside `.quadrant-body`, which
 * is both a scroll box (so an absolutely-positioned child is clipped) and a
 * size container (so `contain: layout` makes it the containing block for
 * `position: fixed` descendants too). Leaving the subtree is the only way
 * out, and once placement is in JS the menu can also flip to the tile's
 * other side rather than hanging off the screen.
 *
 * The anchor is found in the live DOM by `data-obj-id`, the same attribute
 * `AnimationLayer` uses to aim an attack lunge — every battlefield tile is a
 * `MiniTile`, which carries it. A source that isn't on screen falls back to
 * the middle of the viewport rather than rendering somewhere arbitrary.
 */
export function AbilityMenu({
  source,
  title,
  items,
  ariaLabel,
  onClose,
}: {
  readonly source: ObjectId
  /** The permanent's name, as the menu's heading. */
  readonly title: string
  readonly items: readonly AbilityMenuItem[]
  /** What this menu is for, if not a permanent's abilities — the placement
   * and dismissal here suit any short menu hung off a tile, and the count
   * picker for a token stack is the second one. */
  readonly ariaLabel?: string
  readonly onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const place = () => {
      const menu = ref.current
      if (!menu) return
      const anchor = document.querySelector(`[data-obj-id="${CSS.escape(source)}"]`)
      const m = menu.getBoundingClientRect()
      if (anchor === null) {
        menu.style.left = `${Math.max(GAP, (window.innerWidth - m.width) / 2)}px`
        menu.style.top = `${Math.max(GAP, (window.innerHeight - m.height) / 2)}px`
        menu.classList.add('placed')
        return
      }
      const a = anchor.getBoundingClientRect()
      // Beside the tile is the whole point, so a side is tried first: right,
      // then left, then whichever edge leaves more room once neither fits
      // (a tile against the side of a narrow window).
      const right = a.right + GAP
      const left = a.left - GAP - m.width
      const x =
        right + m.width <= window.innerWidth
          ? right
          : left >= 0
            ? left
            : a.left < window.innerWidth / 2
              ? Math.min(right, window.innerWidth - m.width - GAP)
              : Math.max(GAP, left)
      // Top-aligned with the tile, so the menu reads as belonging to it,
      // then pulled back inside the viewport for a tile near the bottom.
      const y = Math.min(
        Math.max(GAP, a.top),
        Math.max(GAP, window.innerHeight - m.height - GAP),
      )
      menu.style.left = `${Math.max(GAP, x)}px`
      menu.style.top = `${y}px`
      menu.classList.add('placed')
    }
    place()
    // The tile moves under an open menu whenever a quadrant scrolls or the
    // window resizes — capture, so a scroll on any of the nested scroll
    // boxes between the tile and the page counts.
    window.addEventListener('scroll', place, { capture: true, passive: true })
    window.addEventListener('resize', place)
    return () => {
      window.removeEventListener('scroll', place, { capture: true })
      window.removeEventListener('resize', place)
    }
  }, [source, items])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    // Containment rather than a `stopPropagation` in the menu's own React
    // handler: React listens at its root, so this capture-phase listener has
    // already run by then and would close the menu before the click could
    // land on the button that was pressed.
    const onPointerDown = (e: PointerEvent) => {
      if (ref.current?.contains(e.target as Node)) return
      // A press on the tile itself is its own toggle — closing here too
      // would fire twice and immediately reopen it.
      if ((e.target as Element | null)?.closest?.(`[data-obj-id="${CSS.escape(source)}"]`)) return
      onClose()
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onPointerDown, true)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', onPointerDown, true)
    }
  }, [onClose, source])

  return createPortal(
    <div
      className="ability-menu"
      ref={ref}
      role="menu"
      aria-label={ariaLabel ?? `${title} abilities`}
    >
      <div className="ability-menu-title">{title}</div>
      {items.map((item) => (
        <button key={item.key} type="button" role="menuitem" onClick={item.onSelect}>
          <Symbols text={item.label} />
        </button>
      ))}
    </div>,
    document.body,
  )
}
