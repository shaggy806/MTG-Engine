/**
 * Hovers that outlast `Table`'s per-frame remount.
 *
 * `Table` remounts on every frame shown, so whatever sits under a resting
 * pointer is a new element each time another player plays a card. The
 * browser puts `:hover` on the new element a moment after it first styles it,
 * so every hover transition played again from the start: a grown hand card
 * shrank and grew, and a tile's popover closed and faded back in (a bug
 * report, 2026-10-07). Here the pointer's place is tracked, so a remount can
 * find what's under it and take up the hover where the old element left it.
 */

/** What a hover belongs to: the hover rules key off these (App.css). */
const HOVER_ROOTS = '.hand-card, .mini-tile-wrap'

/** A selector for `el`'s counterpart after a remount: the same kind of
 * element for the same object, or null without an object id. */
function keyOf(el: HTMLElement): string | null {
  const id = el.dataset.objId
  if (id === undefined) return null
  const kind = el.classList.contains('hand-card') ? '.hand-card' : '.mini-tile-wrap'
  return `${kind}[data-obj-id="${CSS.escape(id)}"]`
}

/** The hover root the pointer last went over, as `keyOf` names it. The
 * browser sends nothing when a hovered element is removed, so after a
 * remount this still names what the pointer was resting on. */
let hovered: string | null = null

/** Where the pointer last was in the viewport; null before it has moved, or
 * once it has left the window. */
let pointer: { readonly x: number; readonly y: number } | null = null

if (typeof window !== 'undefined') {
  window.addEventListener(
    'pointermove',
    (e) => {
      pointer = { x: e.clientX, y: e.clientY }
    },
    { capture: true, passive: true },
  )
  document.addEventListener('mouseout', (e) => {
    if (e.relatedTarget === null) {
      pointer = null
      hovered = null
    }
  })
  document.addEventListener(
    'pointerover',
    (e) => {
      const root = e.target instanceof Element ? e.target.closest<HTMLElement>(HOVER_ROOTS) : null
      hovered = root === null ? null : keyOf(root)
    },
    { capture: true, passive: true },
  )
}

/** The element under the pointer, by hit test (what's on top, not just what
 * contains the point), or null. */
export function elementUnderPointer(): Element | null {
  return pointer === null ? null : document.elementFromPoint(pointer.x, pointer.y)
}

/** Whether the pointer is over `el` (or something inside it) right now. */
export function pointerIsOver(el: Element): boolean {
  const hit = elementUnderPointer()
  return hit !== null && el.contains(hit)
}

/** Frames to wait for the browser's `:hover` before giving up on it. */
const HOVER_WAIT_FRAMES = 10

/**
 * Called as `root` (a freshly remounted board) mounts, before it paints: the
 * counterpart of the card the pointer rested on gets `hover-carry`, which
 * draws a hand card grown as `:hover` does and turns off its transitions and
 * its keyword tips' delayed fade (App.css), so it stands as the element it
 * replaces did. Looked up by object rather than by hit test: a grown hand
 * card covers the pointer only once it is grown, and the browser hovers it
 * only if it does. Dropped at once if the card isn't under the pointer after
 * all (it moved); otherwise when the pointer leaves it, so leaving shrinks it
 * as usual — or, if the browser never hovers it, once the pointer is off it
 * or after a few frames.
 *
 * Returns what takes the class off: for a layout that moves under the pointer
 * before it paints (the hand's measured spacing), which carries again.
 */
export function carryHover(root: HTMLElement): () => void {
  if (hovered === null) return () => {}
  const carried = root.querySelector<HTMLElement>(hovered)
  if (carried === null) return () => {}
  carried.classList.add('hover-carry')
  if (!pointerIsOver(carried)) {
    carried.classList.remove('hover-carry')
    return () => {}
  }
  const release = () => {
    carried.classList.remove('hover-carry')
    carried.removeEventListener('mouseleave', release)
  }
  carried.addEventListener('mouseleave', release)
  let frames = 0
  const wait = () => {
    if (!carried.isConnected || carried.matches(':hover')) return
    frames += 1
    // A pointer that leaves before the browser hovers the card sends no
    // `mouseleave`, so it's looked for here too.
    if (frames >= HOVER_WAIT_FRAMES || !pointerIsOver(carried)) release()
    else requestAnimationFrame(wait)
  }
  requestAnimationFrame(wait)
  return release
}
