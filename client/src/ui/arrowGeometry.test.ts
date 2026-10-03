import { describe, expect, it } from 'vitest'
import { between, edgePoint, pointOn, stackLoop } from './arrowGeometry.ts'
import type { Box, Course, Point } from './arrowGeometry.ts'

const inside = (p: Point, r: Box): boolean =>
  p.x > r.left && p.x < r.left + r.width && p.y > r.top && p.y < r.top + r.height
const along = (c: Course, n = 40): Point[] => Array.from({ length: n + 1 }, (_, i) => pointOn(c, i / n))

describe('edgePoint', () => {
  const card: Box = { left: 0, top: 0, width: 100, height: 140 }

  it('leaves a card from the side facing where it goes, just inside the edge', () => {
    expect(edgePoint(card, { x: 500, y: 70 })).toEqual({ x: 50 + 50 * 0.92, y: 70 })
    expect(edgePoint(card, { x: 50, y: -300 })).toEqual({ x: 50, y: 70 - 70 * 0.92 })
  })

  it('reaches further in when asked', () => {
    expect(edgePoint(card, { x: 500, y: 70 }, 0.55).x).toBeCloseTo(50 + 50 * 0.55)
  })
})

describe('between', () => {
  it('runs from edge to edge with a bow to one side', () => {
    const c = between(
      { left: 0, top: 0, width: 100, height: 100 },
      { left: 700, top: 0, width: 100, height: 100 },
    )
    expect([c.x1, c.y1, c.x2, c.y2]).toEqual([96, 50, 704, 50])
    // Bowed off the straight line by 15% of its length, at most 60px.
    expect(c.cx).toBe(400)
    expect(Math.abs(c.cy - 50)).toBe(60)
    const short = between(
      { left: 0, top: 0, width: 100, height: 100 },
      { left: 200, top: 0, width: 100, height: 100 },
    )
    expect(Math.abs(short.cy - 50)).toBeCloseTo(0.15 * (204 - 96))
  })
})

describe('stackLoop', () => {
  // A Counterspell on top of the stack and the Lightning Bolt it targets one
  // down, showing 20px to the left and 15px lower (Stack's stagger), a little
  // smaller.
  const counterspell: Box = { left: 1000, top: 270, width: 185, height: 260 }
  const bolt: Box = { left: 980, top: 285, width: 171, height: 240 }

  it('leaves the entry from its left edge and lands on the strip of the target that shows', () => {
    const c = stackLoop(counterspell, bolt)
    expect(c.x1).toBe(counterspell.left)
    expect(c.y1).toBeGreaterThan(counterspell.top)
    expect(c.y1).toBeLessThan(counterspell.top + counterspell.height)
    const head = { x: c.x2, y: c.y2 }
    expect(inside(head, bolt)).toBe(true)
    expect(inside(head, counterspell)).toBe(false)
  })

  it('never crosses the face of the entry it leaves, and swings clear of the pile', () => {
    const c = stackLoop(counterspell, bolt)
    expect(along(c).filter((p) => inside(p, counterspell))).toEqual([])
    expect(Math.min(...along(c).map((p) => p.x))).toBeLessThan(bolt.left - 36)
  })

  it('points into the target as it arrives', () => {
    // A head is drawn along the line's last stretch, from the control point.
    const c = stackLoop(counterspell, bolt)
    expect(c.x2 - c.cx).toBeGreaterThan(0)
  })

  it('lands on a target further down the pile, not on what lies between', () => {
    const deep: Box = { left: 940, top: 315, width: 150, height: 210 }
    const c = stackLoop(counterspell, deep)
    expect(inside({ x: c.x2, y: c.y2 }, deep)).toBe(true)
    expect(inside({ x: c.x2, y: c.y2 }, bolt)).toBe(false)
  })

  it('is needed: the usual course between two entries ends under the one it leaves', () => {
    const usual = between(counterspell, bolt)
    expect(inside({ x: usual.x2, y: usual.y2 }, counterspell)).toBe(true)
  })
})
