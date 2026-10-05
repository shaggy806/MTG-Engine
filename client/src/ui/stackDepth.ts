// How a stack entry is drawn at its depth (0 = the top), shared by `Stack`,
// which places every entry, and `AnimationLayer`, which moves the rest of the
// pile forward as an entry leaves mid-frame (`closeStackGap`).

// Cards shift down+left with depth (mirrors a real stack of cards spreading
// out from under the one on top); the offset stops growing past this depth
// so a big stack (10+ objects) doesn't sprawl further and further off to
// the side -- scale/opacity already bottom out on their own (the Math.max
// floors below), this just makes the offset saturate the same way.
const STAGGER_X = 20
const STAGGER_Y = 15
const ROT_STEP = 3
const SCALE_STEP = 0.075
const MIN_SCALE = 0.6
const OPACITY_STEP = 0.12
const MIN_OPACITY = 0.55
const MAX_OFFSET_DEPTH = 7

/**
 * The custom properties `.stack-entry` reads for an entry at `depth` in a pile
 * of `count` — custom properties rather than `top`/`right`/`transform`/
 * `opacity`/`z-index` directly, so `.stack-entry:hover` can cancel the depth
 * styling (bringing a buried card to the front) with a plain CSS rule instead
 * of fighting an inline style.
 */
export function stackDepthVars(depth: number, count: number): Record<string, string | number> {
  const offsetDepth = Math.min(depth, MAX_OFFSET_DEPTH)
  // depth 0 (top) and depth 1 (the card directly behind it) both stay
  // upright; rotation only starts from depth 2 on.
  const rotate = depth <= 1 ? 0 : (Math.min(depth, MAX_OFFSET_DEPTH + 1) - 1) * -ROT_STEP
  return {
    '--st-y': `${offsetDepth * STAGGER_Y}px`,
    '--st-x': `${offsetDepth * STAGGER_X}px`,
    '--st-rot': `${rotate}deg`,
    '--st-scale': Math.max(MIN_SCALE, 1 - depth * SCALE_STEP),
    '--st-opacity': Math.max(MIN_OPACITY, 1 - depth * OPACITY_STEP),
    '--st-z': count - depth,
  }
}

/**
 * An entry has left the stack mid-frame (`AnimationLayer`'s stack exit, which
 * hides it behind a flying copy): the entries still in its pile move up into
 * the gap, each to the depth it now holds, through `.stack-entry`'s own
 * transition. Without this the pile stood still until the frame's new board
 * landed — with a deep stack resolved in one frame, until every entry had
 * gone (a bug report, 2026-10-04). The next board redraws the pile anyway.
 */
export function closeStackGap(left: HTMLElement): void {
  left.dataset.left = 'true'
  const pile = left.closest('.stack-pile')
  if (pile === null) return
  const remaining = [...pile.querySelectorAll<HTMLElement>(':scope > .stack-entry')].filter(
    (el) => el.dataset.left !== 'true',
  )
  remaining.forEach((el, depth) => {
    for (const [name, value] of Object.entries(stackDepthVars(depth, remaining.length))) {
      el.style.setProperty(name, String(value))
    }
    el.classList.toggle('is-top', depth === 0)
  })
}
