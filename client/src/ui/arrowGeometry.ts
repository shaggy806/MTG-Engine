/**
 * Where an arrow over the table runs (`ArrowLayer`), worked out from the
 * boxes on screen of the two things it joins. Kept apart from the component
 * so it can be tested without a DOM.
 */

/** A box on screen in viewport px: a `DOMRect`, or anything shaped like one. */
export interface Box {
  readonly left: number
  readonly top: number
  readonly width: number
  readonly height: number
}

export interface Point {
  readonly x: number
  readonly y: number
}

/** An arrow's line: a quadratic curve from (x1, y1) to (x2, y2), bent through
 * the control point (cx, cy). */
export interface Course {
  readonly x1: number
  readonly y1: number
  readonly x2: number
  readonly y2: number
  readonly cx: number
  readonly cy: number
}

const centre = (r: Box): Point => ({ x: r.left + r.width / 2, y: r.top + r.height / 2 })

/** The point on `r`'s edge facing `toward` (`reach` of the way out from its
 * middle), so a line leaves a card from its side rather than from under its
 * middle. */
export function edgePoint(r: Box, toward: Point, reach = 0.92): Point {
  const { x: cx, y: cy } = centre(r)
  const dx = toward.x - cx
  const dy = toward.y - cy
  if (dx === 0 && dy === 0) return { x: cx, y: cy }
  const sx = dx !== 0 ? r.width / 2 / Math.abs(dx) : Infinity
  const sy = dy !== 0 ? r.height / 2 / Math.abs(dy) : Infinity
  const s = Math.min(sx, sy) * reach
  return { x: cx + dx * s, y: cy + dy * s }
}

/**
 * The usual course, from `from`'s edge facing `to` to `to`'s edge facing
 * `from` (`reach` of the way out from its middle), with a gentle bow — so
 * lines that share an end don't lie on top of each other, and a line reads
 * as an arrow rather than a rule.
 */
export function between(from: Box, to: Box, reach?: number): Course {
  const p1 = edgePoint(from, centre(to))
  const p2 = edgePoint(to, centre(from), reach)
  const mx = (p1.x + p2.x) / 2
  const my = (p1.y + p2.y) / 2
  const len = Math.hypot(p2.x - p1.x, p2.y - p1.y) || 1
  const bow = Math.min(60, len * 0.15)
  return {
    x1: p1.x,
    y1: p1.y,
    x2: p2.x,
    y2: p2.y,
    cx: mx + ((p2.y - p1.y) / len) * bow,
    cy: my - ((p2.x - p1.x) / len) * bow,
  }
}

/**
 * From a stack entry to another entry on the stack — a Counterspell to the
 * spell it counters. What a spell targets on the stack was there before it
 * (its targets are chosen as it's cast, rule 601.2c), so it lies beneath it
 * in the pile, showing only as a strip down and to the left (`Stack`'s
 * stagger), and the usual course would run from the entry's edge to the
 * target's far edge, under the entry itself. This one leaves the entry's
 * left edge, swings out to the left of the pile and comes back in to land on
 * the strip of the target that shows, pointing into it. It is drawn over the
 * pile (`.arrow-layer.over-pile`): under it, as other arrows are, both ends
 * would be hidden by the cards around them.
 */
export function stackLoop(from: Box, to: Box): Course {
  const x1 = from.left
  const y1 = from.top + from.height * 0.3
  // Just inside the target's left edge: a strip only as wide as the pile's
  // stagger shows.
  const x2 = to.left + Math.min(6, to.width * 0.04)
  const y2 = to.top + to.height * 0.5
  // How far the loop bulges out past the nearer edge — a quadratic's bulge
  // is half its control point's offset.
  const out = Math.min(160, Math.max(36, from.width * 0.4))
  return { x1, y1, x2, y2, cx: Math.min(x1, x2) - 2 * out, cy: (y1 + y2) / 2 }
}

/** The point `t` (0 to 1) of the way along a course. */
export function pointOn(c: Course, t: number): Point {
  const u = 1 - t
  return {
    x: u * u * c.x1 + 2 * u * t * c.cx + t * t * c.x2,
    y: u * u * c.y1 + 2 * u * t * c.cy + t * t * c.y2,
  }
}
