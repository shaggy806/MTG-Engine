import { useLayoutEffect, useRef, useState } from 'react'

/** Breathing room between the anchor and its popover, and between the
 * popover and the viewport edge it gets clamped against. */
const POPOVER_GAP = 6

export interface HoverPopover {
  /** Put on the element the popover is positioned against. */
  readonly wrapRef: React.RefObject<HTMLDivElement | null>
  /** Put on the portalled popover itself. */
  readonly popoverRef: React.RefObject<HTMLDivElement | null>
  readonly open: boolean
  /** Spread onto the wrapper — mouse *and* focus, so keyboard/touch reach it
   * too (React's onFocus/onBlur bubble, so a button inside fires them). */
  readonly handlers: {
    readonly onMouseEnter: () => void
    readonly onMouseLeave: () => void
    readonly onFocus: () => void
    readonly onBlur: () => void
  }
}

/**
 * Hover/focus state plus JS placement for a card popover that has to be
 * portalled to `document.body`.
 *
 * It has to be portalled: a tile inside `.quadrant-body` — which is
 * `overflow-y: auto` and therefore *clips* every descendant — had its
 * popover sliced off at the quadrant's edge, and no z-index fixes that. Nor
 * can a fixed-position child escape, now that `.quadrant-body` is a size
 * container: `contain: layout` makes it the containing block for fixed
 * descendants too. Leaving the DOM subtree entirely is the only way out, and
 * once placement is in JS it can also flip above the anchor instead of below
 * when the anchor is near the bottom of the screen, which a CSS `:hover`
 * rule couldn't do either.
 *
 * Placement is written straight to the node rather than held in state: the
 * popover's own size depends on how much rules text the card has, so where
 * it goes can only be decided *after* it has rendered, and feeding that
 * measurement back through state would just re-render to produce the same
 * markup with two numbers changed. It renders `visibility: hidden` for that
 * one layout pass (the `placed` class turns it on), which is also what gives
 * the opacity transition something to start from.
 *
 * @param dep Anything that can change the popover's size while it's open (a
 *   pushed view changing the card's rules text, say) and so is a reason to
 *   re-place it.
 */
export function useHoverPopover(dep?: unknown): HoverPopover {
  const wrapRef = useRef<HTMLDivElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)

  useLayoutEffect(() => {
    if (!open) return
    const place = () => {
      const anchor = wrapRef.current
      const popover = popoverRef.current
      if (!anchor || !popover) return
      const a = anchor.getBoundingClientRect()
      const p = popover.getBoundingClientRect()
      // Below the anchor by preference (the board area below a tile, or the
      // collapsed hand tray under your own board, usually has the most
      // slack); above it when that would run off the bottom of the screen,
      // which is every tile in a bottom-row quadrant once the popover is
      // tall enough to matter; and pinned inside the viewport if neither
      // side fits, since a clipped popover is the thing being fixed here.
      const below = a.bottom + POPOVER_GAP
      const above = a.top - POPOVER_GAP - p.height
      const top =
        below + p.height <= window.innerHeight
          ? below
          : above >= 0
            ? above
            : Math.max(POPOVER_GAP, window.innerHeight - p.height - POPOVER_GAP)
      const left = Math.min(
        Math.max(POPOVER_GAP, a.left),
        Math.max(POPOVER_GAP, window.innerWidth - p.width - POPOVER_GAP),
      )
      popover.style.left = `${left}px`
      popover.style.top = `${top}px`
      popover.classList.add('placed')
    }
    place()
    // The anchor moves under a popover that's already open whenever a
    // quadrant scrolls or the window resizes — capture so a scroll on any
    // of the nested scroll boxes between the anchor and the page counts.
    window.addEventListener('scroll', place, { capture: true, passive: true })
    window.addEventListener('resize', place)
    return () => {
      window.removeEventListener('scroll', place, { capture: true })
      window.removeEventListener('resize', place)
    }
  }, [open, dep])

  return {
    wrapRef,
    popoverRef,
    open,
    handlers: {
      onMouseEnter: () => setOpen(true),
      onMouseLeave: () => setOpen(false),
      onFocus: () => setOpen(true),
      onBlur: () => setOpen(false),
    },
  }
}
