import { Fragment, useLayoutEffect, useState } from 'react'
import type { ObjectId, PlayerView, TargetRef } from 'engine/client'
import { seatClassOf } from '../format.ts'
import type { SeatClass } from '../format.ts'
import { useMotionPrefs } from '../game/motionPrefs.ts'
import { arrowSources, shownTargets } from '../game/resolveAims.ts'
import type { ResolveState } from '../game/resolveAims.ts'
import { between, stackLoop } from './arrowGeometry.ts'
import type { Course } from './arrowGeometry.ts'

/** One line to draw: what it joins, by key, and how it should look. */
interface ArrowSpec {
  /** Stable across frames, so an arrow already standing on the board before
   * this frame doesn't draw itself in again (see `isNew`). */
  readonly key: string
  /** `resolve` is a spell or ability pointing at its targets as it resolves
   * (see `ResolveAims`); `target` is one waiting on the stack. */
  readonly kind: 'target' | 'resolve' | 'attack' | 'block'
  readonly from: string
  readonly to: string
  /** The seat colour of whoever's arrow it is: the attacker's controller, or
   * the controller of the spell or ability doing the targeting. */
  readonly seat: SeatClass | null
  /** How far out from the target's middle the line ends, as a fraction of
   * the way to its edge (see `edgePoint`). */
  readonly reach?: number
  /** It joins two stack entries (see `stackLoop`). */
  readonly loop?: boolean
}

/** How far into a card a resolving arrow reaches: well inside, so the ring
 * flaring at its head is plainly on that tile, not the one beside it. A
 * player's life total, a few characters wide, is pointed at from its edge
 * like any other arrow, so the number stays readable under the head. */
const STRIKE_REACH = 0.55

/** A line as measured: its course in viewport px. */
interface Drawn extends ArrowSpec, Course {
  readonly isNew: boolean
}

const objSel = (id: ObjectId): string => `.board [data-obj-id="${CSS.escape(id)}"]`
const stackSel = (id: ObjectId): string => `.stack-entry[data-stack-id="${CSS.escape(id)}"] .card-tile`
/** A player is pointed at by their life total — what an attack or a burn
 * spell threatens — rather than their whole panel, whose middle (a header
 * strip running the width of the board in two-player) points at nothing. */
const playerSel = (id: string): string => `[data-player-id="${CSS.escape(id)}"] .pp-life`

/** Where a target is drawn: a spell on the stack, a permanent, or a player's
 * panel. */
function targetSel(view: PlayerView, ref: TargetRef): string {
  if (ref.kind === 'player') return playerSel(ref.player)
  return view.zones.stack.includes(ref.object) ? stackSel(ref.object) : objSel(ref.object)
}

const NOTHING_RESOLVING: ResolveState = { resolving: [], gone: [] }

/**
 * Every arrow `view` calls for: the targets of the stack entries in `aimed`
 * (the one the board is marking — the top, or the one the pointer is on),
 * those of whatever is resolving (`resolve.resolving`) in their place, and
 * the combat on the battlefield (each attacker to what it attacks, each
 * blocker to what it blocks). Read from the board's state, not from events,
 * so an arrow stays up exactly as long as what it shows is true — and an
 * entry that has resolved over this board (`resolve.gone`) points at nothing,
 * though the board still has it on the stack.
 */
function arrowsFor(
  view: PlayerView,
  aimed: readonly ObjectId[],
  resolve: ResolveState,
): ArrowSpec[] {
  const out: ArrowSpec[] = []
  const point = (id: ObjectId, kind: 'target' | 'resolve'): void => {
    const entry = view.objects[id]
    if (!entry) return
    for (const t of shownTargets(view, id)) {
      const toKey = t.kind === 'player' ? `p:${t.player}` : `o:${t.object}`
      out.push({
        key: `${kind === 'resolve' ? 'r' : 't'}:${id}->${toKey}`,
        kind,
        from: stackSel(id),
        to: targetSel(view, t),
        seat: seatClassOf(view.turnOrder, entry.controller),
        ...(kind === 'resolve' && t.kind === 'object' ? { reach: STRIKE_REACH } : {}),
        ...(t.kind === 'object' && view.zones.stack.includes(t.object) ? { loop: true } : {}),
      })
    }
  }
  const sources = arrowSources(aimed, resolve)
  for (const id of sources.waiting) point(id, 'target')
  for (const id of sources.resolving) point(id, 'resolve')
  for (const id of view.zones.battlefield) {
    const obj = view.objects[id]
    if (!obj) continue
    if (obj.attacking !== null) {
      const defender = obj.attacking
      // A player, or a planeswalker or battle (an object): told apart by
      // whether it's one of the seats.
      const player = view.turnOrder.find((p) => (p as string) === (defender as string))
      out.push({
        key: `a:${id}->${defender}`,
        kind: 'attack',
        from: objSel(id),
        to: player !== undefined ? playerSel(player) : objSel(defender as ObjectId),
        seat: seatClassOf(view.turnOrder, obj.controller),
      })
    }
    if (obj.blocking !== null) {
      out.push({
        key: `b:${id}->${obj.blocking}`,
        kind: 'block',
        from: objSel(id),
        to: objSel(obj.blocking),
        seat: seatClassOf(view.turnOrder, obj.controller),
      })
    }
  }
  return out
}

/**
 * Arrows over the table: from a spell or ability on the stack to what it
 * targets, from each attacker to what it's attacking, from each blocker to
 * what it's blocking — the "who's pointed at what" a player otherwise has to
 * piece together from frames and chips.
 *
 * Rendered inside `Table`, which remounts every frame, and measured off the
 * live DOM after each mount (and on resize or scroll). An arrow that wasn't on
 * the previous board draws itself in; one that was is simply there, so a frame
 * changing something else doesn't make every arrow on the table redraw.
 *
 * While a frame's first half plays over this board, whatever resolves in it
 * (`resolve`, from the bus's `aims`, played by `usePlayback`) swaps its
 * waiting arrows for solid ones that shoot from its entry to each target,
 * from its resolution's first beat to the end of its exit, and then points at
 * nothing more. A frame resolving several things points from each in turn,
 * though only the top one's arrows were up before.
 */
export function ArrowLayer({
  view,
  previousView,
  aimId,
  resolve,
}: {
  readonly view: PlayerView
  readonly previousView: PlayerView | null
  readonly aimId: ObjectId | null
  /** What is resolving over this board, and what already has (`Table`
   * reads it off the animation bus's `aims`). */
  readonly resolve: ResolveState
}) {
  const { reduced } = useMotionPrefs()
  const [drawn, setDrawn] = useState<readonly Drawn[]>([])

  useLayoutEffect(() => {
    const specs = arrowsFor(view, aimId !== null ? [aimId] : [], resolve)
    // Everything the previous board had, aimed or not: an arrow for a stack
    // entry that was already there isn't new just because the pointer moved.
    // A resolving arrow never was, so it always shoots out.
    const before = new Set(
      previousView === null
        ? []
        : arrowsFor(previousView, previousView.zones.stack, NOTHING_RESOLVING).map((s) => s.key),
    )
    const measure = (): void => {
      const seen = new Set<string>()
      const next: Drawn[] = []
      for (const s of specs) {
        const a = document.querySelector<HTMLElement>(s.from)
        const b = document.querySelector<HTMLElement>(s.to)
        if (!a || !b || a === b) continue
        // A folded tile stands for several permanents: one line per pair of
        // things drawn on screen.
        const pair = `${s.kind}|${s.from}|${s.to}`
        if (seen.has(pair)) continue
        seen.add(pair)
        const ra = a.getBoundingClientRect()
        const rb = b.getBoundingClientRect()
        if (ra.width === 0 || rb.width === 0) continue
        // Between two stack entries the usual course would end under the
        // entry it leaves, so it goes round the pile instead (and over it).
        const course = s.loop ? stackLoop(ra, rb) : between(ra, rb, s.reach)
        next.push({ ...s, ...course, isNew: !before.has(s.key) })
      }
      setDrawn(next)
    }
    measure()
    // The boards size their tiles in a layout pass of their own, and an
    // after-half animation can still be settling, so look again shortly.
    const late = window.setTimeout(measure, 120)
    window.addEventListener('resize', measure)
    // A board scrolling moves its tiles out from under the arrows.
    document.addEventListener('scroll', measure, true)
    return () => {
      window.clearTimeout(late)
      window.removeEventListener('resize', measure)
      document.removeEventListener('scroll', measure, true)
    }
  }, [view, previousView, aimId, resolve])

  if (drawn.length === 0) return null
  const draw = (d: Drawn) => {
    const { cx, cy } = d
    const seat = d.seat?.replace('seat-', '') ?? 'x'
    const head = `url(#arrowhead-${seat})`
    const path = (
      <path
        key={d.key}
        className={`arrow ${d.kind} ${d.seat ?? ''}${d.isNew ? ' is-new' : ''}`}
        d={`M ${d.x1} ${d.y1} Q ${cx} ${cy} ${d.x2} ${d.y2}`}
        pathLength={1}
        markerEnd={d.kind === 'block' || d.kind === 'resolve' ? undefined : head}
        data-arrow={d.key}
      />
    )
    if (d.kind !== 'resolve') return path
    // A resolving arrow's head rides on a sliver of its own at the line's
    // end, pointing the way the curve arrives, so it can wait for the line to
    // get there: on the line itself, a marker is drawn whole from the first
    // frame, and the head sat on the target before the shot.
    const tx = d.x2 - cx
    const ty = d.y2 - cy
    const tl = Math.hypot(tx, ty) || 1
    // Where it lands, a ring flaring out as the line arrives: what the spell
    // hit, said once more than the line itself says it. Keyed as a whole, so
    // the three stay the same elements, their animations running on, however
    // the arrows around them come and go.
    return (
      <Fragment key={d.key}>
        {path}
        <path
          className={`arrow-tip resolve ${d.seat ?? ''}`}
          d={`M ${d.x2 - tx / tl} ${d.y2 - ty / tl} L ${d.x2} ${d.y2}`}
          markerEnd={head}
        />
        <circle className={`arrow-impact ${d.seat ?? ''}`} cx={d.x2} cy={d.y2} r={10} />
      </Fragment>
    )
  }
  const reducedClass = reduced ? ' reduced' : ''
  // From one stack entry to another (`stackLoop`) goes over the pile, in a
  // layer of its own; everything else under it, so a line leaves its stack
  // card from behind. The heads are defined once, in the first layer.
  const overPile = drawn.filter((d) => d.loop)
  return (
    <>
      <svg className={`arrow-layer${reducedClass}`} aria-hidden="true">
        <defs>
          {(['a', 'b', 'c', 'd', 'x'] as const).map((s) => (
            <marker
              key={s}
              id={`arrowhead-${s}`}
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" className={`arrowhead seat-${s}`} />
            </marker>
          ))}
        </defs>
        {drawn.filter((d) => !d.loop).map(draw)}
      </svg>
      {overPile.length > 0 ? (
        <svg className={`arrow-layer over-pile${reducedClass}`} aria-hidden="true">
          {overPile.map(draw)}
        </svg>
      ) : null}
    </>
  )
}
