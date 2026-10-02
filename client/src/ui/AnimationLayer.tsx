import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import type {
  GameEvent,
  ObjectId,
  Phase,
  PlayerId,
  PlayerView,
  TargetRef,
  VisibleObject,
} from 'engine/client'
import { CardTile } from './CardTile.tsx'
import { playerLabel, seatClassOf } from '../format.ts'
import type { SeatClass } from '../format.ts'
import type { SeatStatus } from 'protocol'
import {
  CARD_STEP_MS,
  DEATH_STEP_MS,
  DRAW_STEP_MS,
  ENTER_STEP_MS,
  FLIP_STEP_MS,
  HURT_STEP_MS,
  CROWN_STEP_MS,
  DISCARD_STEP_MS,
  MARK_STEP_MS,
  MAX_PEELED,
  MILL_STAGGER_MS,
  MILL_STEP_MS,
  MOVE_STEP_MS,
  PHASE_STEP_MS,
  REVEAL_STEP_MS,
  STACK_EXIT_MS,
  TAP_STEP_MS,
  TRIGGER_STEP_MS,
  TURN_STEP_MS,
} from '../game/animationSchedule.ts'
import type { AnimationBus, AnimationCue } from '../game/animationBus.ts'
import { motionPrefs } from '../game/motionPrefs.ts'
import { playSound } from '../game/sound.ts'

/** How far an attacker visually lunges toward what it's hitting, in px — a
 * fixed jab distance rather than a fraction of the real gap between the two
 * tiles, so a creature attacking across the whole board doesn't windup
 * absurdly far (see runHit below). */
const LUNGE_DISTANCE_PX = 46
const LUNGE_DURATION_MS = 380
/** Fraction of LUNGE_DURATION_MS at which the lunge reaches its target —
 * matches the lunge keyframes' own `offset: 0.4` peak — so the target's own
 * hit-reaction (runHit's second `.animate()` call) starts right as the
 * attacker actually arrives, not before or after. */
const LUNGE_IMPACT_FRACTION = 0.4
const HIT_REACTION_DURATION_MS = 320
/** Each overlay's visible lifetime *is* the slot its event reserves inside
 * the frame (see animationSchedule.ts), so the next animation picks up right
 * as this one finishes rather than leaving a gap or cutting it off early.
 * The matching CSS `animation-duration`s in App.css are written to the same
 * numbers. */
const PLAYED_CARD_DURATION_MS = CARD_STEP_MS
const TURN_BANNER_DURATION_MS = TURN_STEP_MS
const PHASE_BANNER_DURATION_MS = PHASE_STEP_MS
const DEATH_DURATION_MS = DEATH_STEP_MS
const DRAWN_CARD_DURATION_MS = DRAW_STEP_MS
/** The pose `.mini-tile.tapped` wears in App.css. Untapping starts from it,
 * and by then the tile no longer has the class to read it from. */
const TAPPED_POSE = 'rotate(20deg) scale(0.68)'

/** A duration at the viewer's speed (see `motionPrefs.ts`). Every timer and
 * `.animate()` here goes through this, matching the scaled slots
 * `animationSchedule` reserved for them. */
function scaled(ms: number): number {
  return ms * motionPrefs().animScale
}

/** The words a cast caption adds for a spell not cast from hand. */
const FROM_ZONE: Readonly<Record<string, string>> = {
  graveyard: 'from their graveyard',
  exile: 'from exile',
  command: 'from the command zone',
  library: 'from their library',
}

/** How far the banner queue may fall behind the game before it starts
 * dropping the oldest. */
const MAX_QUEUED_BANNERS = 3

const PHASE_LABEL: Record<Phase, string> = {
  // "beginning" (untap/upkeep/draw) always opens with turn-began, which
  // already gets its own (bigger) banner — a second one half a second later
  // announcing "Beginning Phase" would just be noise, so it's never enqueued
  // (see the `phase === 'beginning'` guard in animationSchedule).
  beginning: '',
  'precombat-main': 'Main Phase',
  combat: 'Combat',
  'postcombat-main': 'Main Phase',
  ending: 'End Phase',
}

/** Cards someone showed the table (rule 701.16). Held up briefly and then
 * gone — the History log keeps the permanent record, so this never has to be
 * dismissed and never blocks anyone. */
interface Reveal {
  readonly key: string
  readonly caption: string
  readonly cards: readonly VisibleObject[]
}

interface PlayedCard {
  readonly key: string
  readonly obj: VisibleObject
  /** Where the card flies in from, as an offset in px from the centre of the
   * viewport to the centre of its owner's cell in the table grid — so a card
   * comes off the side of the screen belonging to whoever played it. Fed to
   * the CSS keyframes as `--fly-x`/`--fly-y`. */
  readonly originX: number
  readonly originY: number
  /** Who played it, spelled out over the card ("Bob casts"), in their seat
   * colour: where it flew in from says which side of the table, but not
   * whose that is. */
  readonly caption: string
  readonly seatClass: SeatClass | null
}

/** The centre of `player`'s cell in the table grid, relative to the centre of
 * the viewport. Measured off the live DOM rather than derived from the seat
 * layout, so the 2-player (stacked) and 3-4 player (2x2) grids both work
 * without this knowing which is on screen. Falls back to straight up from the
 * bottom (your own cards) or down from the top (everyone else's) if the cell
 * can't be found — mid-remount, say. */
/**
 * Where a card *being played* should fly out of.
 *
 * Its own place in the hand fan when it is still there, which is what makes
 * the exit read as the card lifting off rather than vanishing. This works
 * because the cue fires while `usePlayback` is still showing the frame
 * *before* the play — the card is on screen at this instant and gone a
 * moment later, which is also why the position has to be measured now
 * rather than looked up when the animation ends.
 *
 * `null` when the card was never in this seat's hand (an opponent's play, or
 * a cast from the command zone or a graveyard), leaving {@link flyOrigin}'s
 * cell-centre as the fallback.
 */
function handOrigin(object: ObjectId): { x: number; y: number } | null {
  const el = document.querySelector<HTMLElement>(
    `.hand-cards [data-obj-id="${CSS.escape(object)}"]`,
  )
  if (el === null) return null
  const r = el.getBoundingClientRect()
  if (r.width === 0 && r.height === 0) return null
  return {
    x: r.left + r.width / 2 - window.innerWidth / 2,
    y: r.top + r.height / 2 - window.innerHeight / 2,
  }
}

function flyOrigin(player: PlayerId, seat: PlayerId): { x: number; y: number } {
  const panel = document.querySelector<HTMLElement>(
    `[data-player-id="${CSS.escape(player)}"]`,
  )
  const cell = panel?.closest<HTMLElement>('.quadrant-cell') ?? panel
  if (!cell) return { x: 0, y: player === seat ? window.innerHeight * 0.45 : -window.innerHeight * 0.45 }
  const r = cell.getBoundingClientRect()
  return {
    x: r.left + r.width / 2 - window.innerWidth / 2,
    y: r.top + r.height / 2 - window.innerHeight / 2,
  }
}

interface DrawnCard {
  readonly key: string
  /** Start and end of the flight, each an offset in px from the centre of the
   * viewport — the owner's library pile, and the edge of their cell where
   * their hand sits. Fed to the CSS keyframes as `--draw-*`. */
  readonly fromX: number
  readonly fromY: number
  readonly toX: number
  readonly toY: number
}

/**
 * Where a drawn card flies: out of `player`'s library pile and into their
 * hand — the near edge of their cell in the table grid, which is the bottom
 * for you (where your own tray lives) and the top for a seat across the
 * table. Measured off the live DOM so both grid shapes work without this
 * knowing which is on screen; `null` if either end can't be found, in which
 * case the draw simply isn't animated.
 */
function drawFlight(
  player: PlayerId,
): { fromX: number; fromY: number; toX: number; toY: number } | null {
  const pile = document.querySelector<HTMLElement>(
    `[data-library-of="${CSS.escape(player)}"]`,
  )
  const panel = document.querySelector<HTMLElement>(`[data-player-id="${CSS.escape(player)}"]`)
  const cell = panel?.closest<HTMLElement>('.quadrant-cell')
  if (!pile || !cell) return null

  const p = pile.getBoundingClientRect()
  const to = handPoint(cell)
  return {
    fromX: p.left + p.width / 2 - window.innerWidth / 2,
    fromY: p.top + p.height / 2 - window.innerHeight / 2,
    toX: to.x,
    toY: to.y,
  }
}

/** Where a seat's hand is, for a card flying into it: the middle of the near
 * edge of that seat's cell, as an offset from the centre of the viewport.
 * Top half of the table means a seat facing us, so their hand reads as being
 * off the top of their own cell; ours is off the bottom of it. */
function handPoint(cell: HTMLElement): { x: number; y: number } {
  const cy = window.innerHeight / 2
  const c = cell.getBoundingClientRect()
  const topRow = c.top + c.height / 2 < cy
  return { x: c.left + c.width / 2 - window.innerWidth / 2, y: (topRow ? c.top : c.bottom) - cy }
}

interface Banner {
  readonly key: string
  readonly kind: 'turn' | 'phase'
  readonly text: string
  readonly seatClass: SeatClass | null
}

/** The DOM node `MiniTile`/`PlayerPanel` render for a combat participant —
 * `data-obj-id` for a creature/planeswalker, `data-player-id` for a player,
 * found via the `TargetRef` discriminant `damage-dealt` itself carries. */
function elementFor(ref: TargetRef): HTMLElement | null {
  const selector =
    ref.kind === 'object'
      ? `[data-obj-id="${CSS.escape(ref.object)}"]`
      : `[data-player-id="${CSS.escape(ref.player)}"]`
  return document.querySelector<HTMLElement>(selector)
}

/**
 * The transform a tile is already wearing, as a string safe to compose with.
 * A tapped permanent carries `rotate(20deg) scale(0.68)` from CSS — and, on
 * `MiniTile`, that arrives as the separate `rotate`/`scale` properties rather
 * than inside `transform`, so both have to be folded back in by hand.
 */
function srcBaseTransform(el: HTMLElement): string {
  const cs = getComputedStyle(el)
  const parts: string[] = []
  if (cs.transform && cs.transform !== 'none') parts.push(cs.transform)
  if (cs.rotate && cs.rotate !== 'none') parts.push(`rotate(${cs.rotate})`)
  if (cs.scale && cs.scale !== 'none') {
    const [sx, sy = sx] = cs.scale.split(/\s+/)
    parts.push(`scale(${sx}, ${sy})`)
  }
  return parts.join(' ')
}

/**
 * Punches the source's own battlefield tile a short distance toward what it
 * just hit, and shakes/flashes the thing on the receiving end right as the
 * punch lands — triggered off `damage-dealt` (rather than
 * `attacker-declared`) so it fires at the moment a creature actually
 * connects, not when it's merely declared as attacking, and covers a
 * blocker's damage back at its attacker the same way it covers the
 * attacker's own hit. Found via the `data-obj-id`/`data-player-id`
 * attributes `MiniTile`/`PlayerPanel` render, not by anything React owns:
 * this fires while the board on screen is still the one from *before* the
 * frame being played, which is exactly the "before" picture the punch needs
 * to start from (see usePlayback.ts).
 */
function runHit(source: ObjectId, target: TargetRef): void {
  const srcEl = elementFor({ kind: 'object', object: source })
  const targetEl = elementFor(target)
  if (!srcEl || !targetEl) return
  const lungeMs = scaled(LUNGE_DURATION_MS)
  const reactionMs = scaled(HIT_REACTION_DURATION_MS)

  // Reduced motion keeps the information — what got hit — and drops the
  // movement: no jab, no shake, just the red flash on the target.
  if (motionPrefs().reduced) {
    targetEl.animate(
      [
        { filter: 'brightness(1)' },
        { filter: 'brightness(1.5) drop-shadow(0 0 10px rgba(255, 70, 70, 0.85))', offset: 0.3 },
        { filter: 'brightness(1)' },
      ],
      { duration: lungeMs + reactionMs, easing: 'ease-out' },
    )
    return
  }

  const a = srcEl.getBoundingClientRect()
  const d = targetEl.getBoundingClientRect()
  const dx = d.left + d.width / 2 - (a.left + a.width / 2)
  const dy = d.top + d.height / 2 - (a.top + a.height / 2)
  const dist = Math.hypot(dx, dy) || 1
  // Kept inside the board's scroll box: that box clips it at its edge anyway,
  // and a tile translated past its bottom or right edge counts toward the
  // box's scrollable overflow, flashing a scrollbar for the length of the
  // jab (an opponent's creature near the bottom of a crowded board, lunging
  // down at you).
  const box = srcEl.closest('.quadrant-body')?.getBoundingClientRect()
  // The room between the tile and each edge, never past zero either way (a
  // tile already scrolled partly out of view just doesn't move that way).
  const within = (v: number, lo: number, hi: number) =>
    Math.max(Math.min(0, lo), Math.min(Math.max(0, hi), v))
  const nx = box
    ? within((dx / dist) * LUNGE_DISTANCE_PX, box.left - a.left, box.right - a.right)
    : (dx / dist) * LUNGE_DISTANCE_PX
  const ny = box
    ? within((dy / dist) * LUNGE_DISTANCE_PX, box.top - a.top, box.bottom - a.bottom)
    : (dy / dist) * LUNGE_DISTANCE_PX
  const base = srcBaseTransform(srcEl)

  // The jab itself travels on the outer box (`data-obj-id`), which carries no
  // transform of its own, so the path is a straight line to the target.
  srcEl.animate(
    [
      { transform: `translate(0, 0) ${base}`, offset: 0 },
      { transform: `translate(${nx}px, ${ny}px) ${base}`, offset: LUNGE_IMPACT_FRACTION },
      { transform: `translate(0, 0) ${base}`, offset: 1 },
    ],
    { duration: lungeMs, easing: 'ease-out' },
  )

  // Only the box moves: the tile inside keeps whatever tilt it has (an
  // attacker is tapped). Straightening it up to full size as it connected
  // was tried, and read as the card spinning rather than striking.

  window.setTimeout(() => {
    // Direction-agnostic shake (a fixed left/right wobble, not aimed back
    // along the hit vector) -- simpler than steering it, and reads the same
    // either way since it's over in a fifth of a second. Composed onto the
    // target's own transform for the same reason as the lunge above: a
    // blocker taking damage back is usually tapped too.
    const targetBase = srcBaseTransform(targetEl)
    targetEl.animate(
      [
        { transform: `translate(0, 0) ${targetBase}`, filter: 'brightness(1)', offset: 0 },
        {
          transform: `translate(-5px, 0) ${targetBase}`,
          filter: 'brightness(1.5) drop-shadow(0 0 10px rgba(255, 70, 70, 0.85))',
          offset: 0.22,
        },
        { transform: `translate(4px, 0) ${targetBase}`, offset: 0.5 },
        { transform: `translate(-2px, 0) ${targetBase}`, offset: 0.78 },
        { transform: `translate(0, 0) ${targetBase}`, filter: 'brightness(1)', offset: 1 },
      ],
      { duration: reactionMs, easing: 'ease-out' },
    )
  }, lungeMs * LUNGE_IMPACT_FRACTION)
}

/**
 * A permanent leaving the board, shown where it stands — there's no graveyard
 * or exile drawn on the table for it to travel to. Where it went decides the
 * look, so exile can't be mistaken for dying: a permanent going to a
 * graveyard drains of colour and sinks away; one going to exile flares
 * white-blue and dissolves upward; anything else (a library, the command
 * zone) just fades. Runs while the board on screen is still the one that has
 * it (see usePlayback), and the frame holds that board for `DEATH_STEP_MS`,
 * so the tile is gone by the time it finishes rather than blinking out.
 */
function runDeath(object: ObjectId, toZone: string): void {
  const el = elementFor({ kind: 'object', object })
  if (!el) return // never drawn (entered and left inside one frame)
  const timing: KeyframeAnimationOptions = {
    duration: scaled(DEATH_DURATION_MS),
    easing: 'ease-in',
    fill: 'forwards',
  }
  if (motionPrefs().reduced) {
    // Still told apart by colour, without the movement.
    const tint = toZone === 'exile' ? 'brightness(1.8) saturate(0.3)' : 'grayscale(1)'
    el.animate([{ opacity: 1, filter: 'none' }, { opacity: 0, filter: tint }], timing)
    return
  }
  const base = srcBaseTransform(el)
  if (toZone === 'exile') {
    el.animate(
      [
        { opacity: 1, filter: 'brightness(1) blur(0)', transform: `translateY(0) scale(1) ${base}` },
        {
          opacity: 1,
          filter:
            'brightness(2) saturate(0.3) drop-shadow(0 0 12px rgba(150, 220, 255, 0.95))',
          transform: `translateY(0) scale(1.05) ${base}`,
          offset: 0.3,
        },
        {
          opacity: 0,
          filter: 'brightness(2.4) saturate(0) blur(4px)',
          transform: `translateY(-18%) scale(1.12) ${base}`,
        },
      ],
      timing,
    )
    return
  }
  if (toZone === 'graveyard') {
    el.animate(
      [
        { opacity: 1, filter: 'grayscale(0)', transform: `translateY(0) scale(1) ${base}` },
        {
          opacity: 0.9,
          filter: 'grayscale(0.8) brightness(0.8)',
          transform: `translateY(0) scale(0.97) ${base}`,
          offset: 0.3,
        },
        {
          opacity: 0,
          filter: 'grayscale(1) brightness(0.4)',
          transform: `translateY(14%) scale(0.8) ${base}`,
        },
      ],
      timing,
    )
    return
  }
  el.animate([{ opacity: 1 }, { opacity: 0 }], timing)
}

/**
 * Flies a copy of an element from where it is now to `to` (an offset from
 * the centre of the viewport), shrinking and fading as it lands — the one
 * helper every "a card moves from here to there" animation goes through.
 *
 * A copy, because the element itself belongs to a board that `Table` is about
 * to remount: the copy lives in its own container on `<body>`, outside React
 * entirely, and removes itself when it lands. The original is hidden for the
 * flight so the card doesn't appear to be in two places. Sized from the
 * tile's layout box rather than its on-screen one, which a tapped tile's
 * tilt makes wider than the tile itself.
 */
function flyGhost(el: HTMLElement, to: { x: number; y: number }, duration: number): void {
  const ghost = makeGhost(el)
  if (ghost === null) return
  const { box, rect: r } = ghost
  const dx = to.x - (r.left + r.width / 2 - window.innerWidth / 2)
  const dy = to.y - (r.top + r.height / 2 - window.innerHeight / 2)
  releaseWhenDone(
    box,
    box.animate(
      [
        { transform: 'translate(0, 0) scale(1)', opacity: 1 },
        {
          transform: `translate(${dx * 0.15}px, ${dy * 0.15}px) scale(1.08)`,
          opacity: 1,
          offset: 0.2,
        },
        { transform: `translate(${dx}px, ${dy}px) scale(0.55)`, opacity: 0 },
      ],
      { duration, easing: 'cubic-bezier(0.3, 0, 0.35, 1)', fill: 'forwards' },
    ),
  )
}

/**
 * The copy `flyGhost` and the stack exits fly: `el` cloned into its own
 * fixed box on `<body>`, placed exactly over it, with the original hidden.
 *
 * The copy has left whatever sized it, so the size tokens its contents read
 * are pinned on the box in px: `--mini-w` from a battlefield tile's own
 * layout width (not its tilted on-screen box), `--card-w` from a card's. And
 * it's put back into the box's flow: a stack entry is absolutely placed by
 * its depth, and would replay its arrival animation as a new node.
 */
function makeGhost(el: HTMLElement): { box: HTMLElement; rect: DOMRect } | null {
  const rect = el.getBoundingClientRect()
  if (rect.width === 0 && rect.height === 0) return null
  const copy = el.cloneNode(true) as HTMLElement
  copy.removeAttribute('data-obj-id')
  copy.removeAttribute('data-stack-id')
  Object.assign(copy.style, {
    position: 'relative',
    top: '0',
    right: '0',
    animation: 'none',
    transition: 'none',
  })
  const box = document.createElement('div')
  box.className = 'ghost-flight'
  const tile = el.querySelector<HTMLElement>('.mini-tile')
  if (tile) box.style.setProperty('--mini-w', `${tile.offsetWidth}px`)
  const card = el.querySelector<HTMLElement>('.card-tile')
  if (card) box.style.setProperty('--card-w', `${card.offsetWidth}px`)
  box.style.left = `${rect.left}px`
  box.style.top = `${rect.top}px`
  box.style.width = `${rect.width}px`
  box.style.height = `${rect.height}px`
  box.appendChild(copy)
  document.body.appendChild(box)
  el.style.visibility = 'hidden'
  return { box, rect }
}

function releaseWhenDone(box: HTMLElement, animation: Animation): void {
  animation.onfinish = () => box.remove()
  animation.oncancel = () => box.remove()
}

/** The stack entry an event is about, on the board still on screen: the
 * spell or ability by its own id. Never another entry standing in for it —
 * an ability put on the stack and resolved within one frame was never drawn,
 * and finding it by its source instead dissolved an older ability of the
 * same permanent, further down, which then came back on the next board. */
function stackEntryFor(ev: GameEvent): HTMLElement | null {
  if (
    ev.type === 'ability-resolved' ||
    ev.type === 'spell-resolved' ||
    ev.type === 'spell-countered' ||
    ev.type === 'spell-fizzled'
  ) {
    return document.querySelector<HTMLElement>(
      `.stack-entry[data-stack-id="${CSS.escape(ev.object)}"]`,
    )
  }
  return null
}

/**
 * Something leaving the stack, over the board it's still on. A resolving
 * permanent spell flies to its controller's side of the table, where it's
 * about to appear. Everything else ends where it is — there's no graveyard
 * drawn to send it to: an instant or sorcery flares and lifts away, spent; an
 * ability dissolves; a countered or fizzled spell visibly breaks — a shudder,
 * drained of colour, then it drops and fades — so it can't be mistaken for
 * having resolved. Reduced motion fades the entry, whatever the outcome.
 */
function runStackExit(ev: GameEvent, view: PlayerView, seat: PlayerId): void {
  const el = stackEntryFor(ev)
  if (!el) return
  const duration = scaled(STACK_EXIT_MS)
  if (motionPrefs().reduced) {
    el.animate([{ opacity: 1 }, { opacity: 0 }], { duration, fill: 'forwards' })
    return
  }
  if (ev.type === 'ability-resolved') {
    const ghost = makeGhost(el)
    if (ghost === null) return
    releaseWhenDone(
      ghost.box,
      ghost.box.animate(
        [
          { transform: 'scale(1)', opacity: 1, filter: 'brightness(1)' },
          { transform: 'scale(1.04)', opacity: 0.9, filter: 'brightness(1.4)', offset: 0.3 },
          { transform: 'scale(0.8)', opacity: 0, filter: 'brightness(1.8) blur(2px)' },
        ],
        { duration, easing: 'ease-in', fill: 'forwards' },
      ),
    )
    return
  }
  if (ev.type !== 'spell-resolved' && ev.type !== 'spell-countered' && ev.type !== 'spell-fizzled') {
    return
  }
  const obj = view.objects[ev.object]
  if (ev.type === 'spell-resolved' && obj?.zone === 'battlefield') {
    // A permanent: to its controller's side, where it's about to appear.
    flyGhost(el, flyOrigin(obj.controller, seat), duration)
    return
  }
  const ghost = makeGhost(el)
  if (ghost === null) return
  if (ev.type === 'spell-resolved') {
    releaseWhenDone(
      ghost.box,
      ghost.box.animate(
        [
          { transform: 'translateY(0) scale(1)', opacity: 1, filter: 'brightness(1)' },
          {
            transform: 'translateY(0) scale(1.05)',
            opacity: 1,
            filter: 'brightness(1.6) drop-shadow(0 0 14px rgba(255, 200, 90, 0.9))',
            offset: 0.3,
          },
          { transform: 'translateY(-12%) scale(0.95)', opacity: 0, filter: 'brightness(2) blur(3px)' },
        ],
        { duration, easing: 'ease-in', fill: 'forwards' },
      ),
    )
    return
  }
  releaseWhenDone(
    ghost.box,
    ghost.box.animate(
      [
        { transform: 'translate(0, 0) rotate(0deg)', filter: 'grayscale(0)', opacity: 1 },
        { transform: 'translate(-6px, 0) rotate(-2deg)', filter: 'grayscale(0.7)', offset: 0.12 },
        { transform: 'translate(6px, 0) rotate(2deg)', filter: 'grayscale(1)', offset: 0.24 },
        {
          transform: 'translate(0, 0) rotate(0deg)',
          filter: 'grayscale(1) brightness(0.6)',
          opacity: 1,
          offset: 0.4,
        },
        {
          transform: 'translate(0, 16%) rotate(6deg) scale(0.85)',
          filter: 'grayscale(1) brightness(0.4)',
          opacity: 0,
        },
      ],
      { duration, easing: 'ease-in', fill: 'forwards' },
    ),
  )
}

/**
 * The permanent a triggered ability came from lights up as the trigger goes
 * on the stack, so where a trigger came from is visible on the board and not
 * only in its stack label. Plays over the new board (its ability is on the
 * stack there); a source that has already left, a dies trigger's, has no
 * tile to light. Under reduced motion it glows without the swell.
 */
function runPulse(source: ObjectId, delay: number): void {
  const tile = document.querySelector<HTMLElement>(
    `[data-obj-id="${CSS.escape(source)}"] .mini-tile`,
  )
  if (!tile) return
  const timing: KeyframeAnimationOptions = { duration: scaled(TRIGGER_STEP_MS), delay, easing: 'ease-out' }
  tile.animate(
    [
      { boxShadow: '0 0 0 0 rgba(255, 190, 70, 0)' },
      {
        boxShadow: '0 0 0 3px rgba(255, 198, 86, 0.95), 0 0 20px 6px rgba(255, 160, 40, 0.7)',
        offset: 0.35,
      },
      { boxShadow: '0 0 0 0 rgba(255, 190, 70, 0)' },
    ],
    timing,
  )
  if (!motionPrefs().reduced) {
    tile.animate([{ scale: '1' }, { scale: '1.08', offset: 0.35 }, { scale: '1' }], timing)
  }
}

/** The sound an event makes, if any (and if the viewer has sound on). */
function soundFor(ev: GameEvent): void {
  switch (ev.type) {
    case 'spell-cast':
    case 'land-played':
      playSound('cast')
      return
    case 'damage-dealt':
      if (ev.combat) playSound('hit')
      return
    case 'permanent-left-battlefield':
      playSound(ev.toZone === 'exile' ? 'exile' : 'death')
      return
    case 'life-changed':
      playSound(ev.delta > 0 ? 'gain' : 'loss')
      return
    case 'turn-began':
      playSound('turn')
      return
    case 'permanent-tapped':
      playSound('tap')
      return
    default:
      return
  }
}

/** A permanent's tile on the battlefield — its outer `data-obj-id` box (the
 * hand and the stack carry the id too, so this looks only on a board). */
function boardTileOf(object: ObjectId): HTMLElement | null {
  const id = CSS.escape(object)
  // A permanent the board folded into another's tile (two Soldiers from
  // Raise the Alarm) is drawn by that tile, which lists it in `data-obj-ids`.
  return (
    document.querySelector<HTMLElement>(`.board [data-obj-id="${id}"]`) ??
    document.querySelector<HTMLElement>(`.board [data-obj-ids~="${id}"] [data-obj-id]`)
  )
}

/**
 * Arrivals in one frame, one animation per tile: identical permanents fold
 * into one tile, so several can arrive on it at once. A tile that's new grows
 * in once and says "×N"; one already on the board that some joined just
 * glows and says "+N" rather than arriving again.
 */
function runEnters(
  cues: readonly { readonly object: ObjectId; readonly isToken: boolean; readonly delay: number }[],
): void {
  const arriving = new Set(cues.map((c) => c.object))
  const byTile = new Map<HTMLElement, { first: (typeof cues)[number]; count: number }>()
  for (const cue of cues) {
    const wrap = boardTileOf(cue.object)
    if (!wrap) continue
    const seen = byTile.get(wrap)
    if (seen) seen.count += 1
    else byTile.set(wrap, { first: cue, count: 1 })
  }
  for (const [wrap, { first, count }] of byTile) {
    const shown = wrap.dataset.objId as ObjectId | undefined
    const duration = scaled(ENTER_STEP_MS)
    if (shown === undefined || arriving.has(shown)) {
      runEnter(first.object, first.isToken, first.delay)
      if (count > 1) floatText(wrap, `×${count}`, 'info', first.delay, duration * 1.5)
    } else {
      const tile = wrap.querySelector<HTMLElement>('.mini-tile')
      if (tile) glow(tile, 'gain', first.delay, duration)
      floatText(wrap, `+${count}`, 'gain', first.delay, duration * 1.5)
    }
  }
}

type Tone = 'gain' | 'loss' | 'info'

/** The glow colour for each tone, as the `r, g, b` an `rgba()` takes. */
const TONE_RGB: Record<Tone, string> = {
  gain: '110, 220, 140',
  loss: '255, 90, 90',
  info: '130, 190, 255',
}

/**
 * A few words floating up off an element and fading: "−3" off a life total,
 * "+1/+1" off a creature, "Flying" off one that just gained it. Made outside
 * React, like the ghosts, and gone when it's done. Waits out `delay` hidden
 * (`fill: 'both'`), since after-half cues are all started at once. Under
 * reduced motion it fades where it is instead of rising.
 */
function floatText(from: Element, text: string, tone: Tone, delay: number, duration: number): void {
  const r = from.getBoundingClientRect()
  if (r.width === 0 && r.height === 0) return
  const el = document.createElement('div')
  el.className = `float-text ${tone}`
  el.textContent = text
  el.style.left = `${r.left + r.width / 2}px`
  el.style.top = `${r.top + r.height / 2}px`
  document.body.appendChild(el)
  const rise = motionPrefs().reduced ? 0 : 1
  const animation = el.animate(
    [
      { opacity: 0, transform: `translate(-50%, -50%) translateY(${0.4 * rise}em) scale(0.85)` },
      { opacity: 1, transform: 'translate(-50%, -50%) scale(1.1)', offset: 0.18 },
      { opacity: 1, transform: `translate(-50%, -50%) translateY(${-1.2 * rise}em)`, offset: 0.7 },
      { opacity: 0, transform: `translate(-50%, -50%) translateY(${-2 * rise}em)` },
    ],
    { duration, delay, easing: 'ease-out', fill: 'both' },
  )
  animation.onfinish = () => el.remove()
  animation.oncancel = () => el.remove()
}

/** A ring of colour round a tile that comes and goes: counters, buffs. */
function glow(el: HTMLElement, tone: Tone, delay: number, duration: number): void {
  const rgb = TONE_RGB[tone]
  el.animate(
    [
      { boxShadow: `0 0 0 0 rgba(${rgb}, 0)` },
      { boxShadow: `0 0 0 3px rgba(${rgb}, 0.95), 0 0 18px 5px rgba(${rgb}, 0.6)`, offset: 0.3 },
      { boxShadow: `0 0 0 0 rgba(${rgb}, 0)` },
    ],
    { duration, delay, easing: 'ease-out' },
  )
}

/**
 * A permanent arriving: it grows into its place on the new board rather than
 * popping in. A token, which had no spell to show it coming, also shimmers in
 * cyan, so making tokens reads differently from a spell resolving. Reduced
 * motion fades it in.
 */
function runEnter(object: ObjectId, isToken: boolean, delay: number): void {
  const wrap = boardTileOf(object)
  if (!wrap) return
  const duration = scaled(ENTER_STEP_MS)
  const timing: KeyframeAnimationOptions = { duration, delay, easing: 'cubic-bezier(0.2, 0.9, 0.3, 1.2)', fill: 'backwards' }
  if (motionPrefs().reduced) wrap.animate([{ opacity: 0 }, { opacity: 1 }], timing)
  else {
    wrap.animate(
      [
        { opacity: 0, scale: '0.55', translate: '0 -0.8em' },
        { opacity: 1, scale: '1', translate: '0 0' },
      ],
      timing,
    )
  }
  const tile = wrap.querySelector<HTMLElement>('.mini-tile')
  if (isToken && tile) {
    tile.animate(
      [
        { filter: 'brightness(2) saturate(0.4)', boxShadow: '0 0 0 3px rgba(120, 230, 255, 0.95), 0 0 22px 8px rgba(90, 210, 255, 0.7)' },
        { filter: 'brightness(1) saturate(1)', boxShadow: '0 0 0 0 rgba(120, 230, 255, 0)' },
      ],
      { duration: duration * 1.4, delay, easing: 'ease-out', fill: 'backwards' },
    )
  }
}

/** "+1/+1", "+1/+1 ×2", "+1 charge": what a `counter-added` says, as short
 * as it can. A P/T counter's kind already carries its sign. */
function counterText(counter: string, amount: number): string {
  if (/^[+-]\d+\/[+-]\d+$/.test(counter)) return amount > 1 ? `${counter} ×${amount}` : counter
  return `+${amount} ${counter}`
}

/**
 * Counters landing on a permanent, or a buff that isn't counters (a pump
 * until end of turn, a granted keyword): the tile glows and the change floats
 * off it. Counters and buffs glow in different colours — green (or purple for
 * a −1/−1 counter) for counters, blue for a buff, red for a shrink — so a
 * permanent getting bigger for good reads differently from one pumped for
 * the turn.
 */
function runMark(ev: GameEvent, delay: number): void {
  if (ev.type !== 'counter-added' && ev.type !== 'pt-modified' && ev.type !== 'keyword-granted') {
    return
  }
  const wrap = boardTileOf(ev.object)
  const tile = wrap?.querySelector<HTMLElement>('.mini-tile')
  if (!wrap || !tile) return
  const duration = scaled(MARK_STEP_MS)
  let tone: Tone
  let text: string
  if (ev.type === 'counter-added') {
    const shrinking = ev.counter.startsWith('-')
    tone = shrinking ? 'loss' : 'gain'
    text = counterText(ev.counter, ev.amount)
    if (shrinking) glow(tile, 'loss', delay, duration)
    else glow(tile, 'gain', delay, duration)
  } else if (ev.type === 'pt-modified') {
    const sign = (n: number): string => (n >= 0 ? `+${n}` : `−${-n}`)
    tone = ev.power + ev.toughness < 0 ? 'loss' : 'info'
    text = `${sign(ev.power)}/${sign(ev.toughness)}`
    glow(tile, tone, delay, duration)
  } else {
    tone = 'info'
    text = ev.keyword.charAt(0).toUpperCase() + ev.keyword.slice(1)
    glow(tile, 'info', delay, duration)
  }
  floatText(wrap, text, tone, delay, duration * 1.5)
}

/** A double-faced card turning over: the new face swings in edge-on. */
function runFlip(object: ObjectId, delay: number): void {
  const tile = boardTileOf(object)?.querySelector<HTMLElement>('.mini-tile')
  if (!tile) return
  tile.animate(
    [
      { rotate: 'y 90deg', filter: 'brightness(1.8)' },
      { rotate: 'y 0deg', filter: 'brightness(1)' },
    ],
    { duration: scaled(FLIP_STEP_MS), delay, easing: 'ease-out', fill: 'backwards' },
  )
}

/**
 * Life gained or lost, or damage marked on a creature: a green or red flash
 * and the amount floating off it. A player's shows on their panel's life
 * total; a creature's on its tile, if it survived to be on the new board (one
 * that died has already faded). Colour and a number, so reduced motion keeps
 * all of it but the rise.
 */
function runHurt(ev: GameEvent, delay: number): void {
  const duration = scaled(HURT_STEP_MS)
  if (ev.type === 'life-changed') {
    const panel = document.querySelector<HTMLElement>(`[data-player-id="${CSS.escape(ev.player)}"]`)
    if (!panel) return
    const tone: Tone = ev.delta > 0 ? 'gain' : 'loss'
    const rgb = TONE_RGB[tone]
    panel.animate(
      [
        { boxShadow: `inset 0 0 0 0 rgba(${rgb}, 0)` },
        { boxShadow: `inset 0 0 0 2px rgba(${rgb}, 0.9), 0 0 22px 2px rgba(${rgb}, 0.55)`, offset: 0.2 },
        { boxShadow: `inset 0 0 0 0 rgba(${rgb}, 0)` },
      ],
      { duration, delay, easing: 'ease-out' },
    )
    const life = panel.querySelector<HTMLElement>('.pp-life') ?? panel
    life.animate([{ color: `rgb(${rgb})` }, { color: `rgb(${rgb})`, offset: 0.6 }, {}], {
      duration,
      delay,
      fill: 'backwards',
    })
    floatText(life, ev.delta > 0 ? `+${ev.delta}` : `−${-ev.delta}`, tone, delay, duration * 1.3)
    return
  }
  if (ev.type !== 'damage-dealt' || ev.target.kind !== 'object') return
  const wrap = boardTileOf(ev.target.object)
  if (!wrap) return
  const tile = wrap.querySelector<HTMLElement>('.mini-tile')
  // Combat damage already had its hit reaction over the old board; burn and
  // abilities had nothing, so they get the red flash here.
  if (tile && !ev.combat) glow(tile, 'loss', delay, duration)
  floatText(wrap, `−${ev.amount}`, 'loss', delay, duration * 1.3)
}

/**
 * A permanent returned to its owner's hand flies there — the draw flight run
 * in reverse — to the hand edge of its *owner's* cell, read off the old board
 * (`prev`), so a stolen creature goes home rather than to whoever had it.
 * Falls back to the board it was on, then to the ordinary fade where there's
 * nothing to fly or motion is reduced.
 */
function runBounce(object: ObjectId, prev: PlayerView | null): void {
  const el = elementFor({ kind: 'object', object })
  const owner = prev?.objects[object]?.owner
  const ownerCell = owner
    ? document
        .querySelector<HTMLElement>(`[data-player-id="${CSS.escape(owner)}"]`)
        ?.closest<HTMLElement>('.quadrant-cell')
    : null
  const cell = ownerCell ?? el?.closest<HTMLElement>('.quadrant-cell')
  if (!el || !cell || motionPrefs().reduced) {
    runDeath(object, 'hand')
    return
  }
  flyGhost(el, handPoint(cell), scaled(DEATH_DURATION_MS))
}

/**
 * Cards leaving a library from the top, shown on the library pile — there's
 * no graveyard or exile drawn to send them to. Each peels off the top as a
 * cardback and turns over as it goes: a milled card darkening as it drops
 * away, an exiled one flaring white-blue and dissolving upward, so the two
 * read differently.
 *
 * So the number reads: the cards go one after another (`MILL_STAGGER_MS`
 * apart, up to `MAX_PEELED` of them), the pile's count ticks down as each
 * one leaves — this is the old board, so it would otherwise sit on the old
 * number and then jump — and the total floats off the pile ("−3 milled").
 */
function runMill(ev: GameEvent, view: PlayerView, prev: PlayerView | null): void {
  // How many leave each library: a mill is one player's; an exile from the
  // top may take from several (each card's owner, which the view lists for
  // every exiled card, face down or not).
  const counts = new Map<PlayerId, number>()
  let exile: boolean
  if (ev.type === 'cards-milled') {
    counts.set(ev.player, ev.objects.length)
    exile = false
  } else if (ev.type === 'cards-put-into-exile') {
    for (const a of ev.arrivals) {
      if (a.from !== 'library') continue
      const owner = view.zones.exileOwners[a.object] ?? prev?.objects[a.object]?.owner
      if (owner) counts.set(owner, (counts.get(owner) ?? 0) + 1)
    }
    exile = true
  } else return
  for (const [player, count] of counts) millFrom(player, count, exile)
}

/** `count` cards peeling off the top of `player`'s library — see
 * {@link runMill}. */
function millFrom(player: PlayerId, count: number, exile: boolean): void {
  const pile = document.querySelector<HTMLElement>(`[data-library-of="${CSS.escape(player)}"]`)
  if (!pile || count <= 0) return
  const duration = scaled(MILL_STEP_MS)
  const stagger = scaled(MILL_STAGGER_MS)
  const reduced = motionPrefs().reduced
  const shown = Math.min(count, MAX_PEELED)
  const total = duration + (shown - 1) * stagger
  floatText(pile, `−${count} ${exile ? 'exiled' : 'milled'}`, 'loss', 0, total)

  // The counts on the old board, run in step: the library's down — "Library
  // (53)" over the pile, the number on its cardback when the top isn't
  // revealed, "library 53" in the player's panel — and the graveyard's (or
  // exile's) up, by an even share of the cards for each one shown leaving,
  // as it lifts clear of the pile.
  const who = CSS.escape(player)
  const counters: { el: HTMLElement; sign: -1 | 1 }[] = [
    pile.parentElement?.querySelector<HTMLElement>('.side-zone-label'),
    pile.querySelector<HTMLElement>('.card-back-count'),
    document.querySelector<HTMLElement>(`[data-library-count-of="${who}"]`),
  ]
    .filter((el): el is HTMLElement => el != null)
    .map((el) => ({ el, sign: -1 as const }))
  const into = document.querySelector<HTMLElement>(
    exile ? `[data-exile-count-of="${who}"]` : `[data-graveyard-count-of="${who}"]`,
  )
  if (into) counters.push({ el: into, sign: 1 })
  for (const { el, sign } of counters) {
    const start = Number(/\d+/.exec(el.textContent ?? '')?.[0] ?? NaN)
    if (!Number.isFinite(start)) continue
    for (let i = 0; i < shown; i += 1) {
      const moved = Math.ceil((count * (i + 1)) / shown)
      const value = Math.max(0, start + sign * moved)
      window.setTimeout(() => {
        el.textContent = el.textContent?.replace(/\d+/, String(value)) ?? null
      }, i * stagger + duration * 0.35)
    }
  }

  const r = pile.getBoundingClientRect()
  if (r.width === 0) return
  for (let i = 0; i < shown; i += 1) {
    const card = document.createElement('div')
    card.className = 'peel-card'
    card.style.left = `${r.left}px`
    card.style.top = `${r.top}px`
    card.style.width = `${r.width}px`
    card.style.height = `${r.height}px`
    card.appendChild(document.createElement('div')).className = 'card-back'
    document.body.appendChild(card)
    const frames: Keyframe[] = reduced
      ? [
          { opacity: 1, filter: 'none' },
          { opacity: 0, filter: exile ? 'brightness(1.8) saturate(0.3)' : 'grayscale(1) brightness(0.5)' },
        ]
      : exile
        ? [
            { opacity: 1, transform: 'translateY(0) rotateY(0deg)', filter: 'brightness(1)' },
            {
              opacity: 1,
              transform: 'translateY(-25%) rotateY(70deg)',
              filter: 'brightness(2) drop-shadow(0 0 12px rgba(150, 220, 255, 0.95))',
              offset: 0.45,
            },
            {
              opacity: 0,
              transform: 'translateY(-55%) rotateY(90deg) scale(1.1)',
              filter: 'brightness(2.4) saturate(0) blur(4px)',
            },
          ]
        : [
            { opacity: 1, transform: 'translate(0, 0) rotateY(0deg)', filter: 'brightness(1)' },
            { opacity: 1, transform: 'translate(0, -30%) rotateY(70deg)', offset: 0.4 },
            {
              opacity: 0,
              transform: 'translate(8%, 25%) rotateY(90deg) scale(0.85)',
              filter: 'grayscale(1) brightness(0.4)',
            },
          ]
    const a = card.animate(frames, {
      duration,
      delay: i * stagger,
      easing: 'ease-in-out',
      fill: 'both',
    })
    a.onfinish = () => card.remove()
    a.oncancel = () => card.remove()
  }
}

/**
 * A discarded card leaving the hand, where it is. Your own card lifts out of
 * the fan and greys away; another player's hand isn't drawn, so their "hand"
 * link flashes red and says how many went.
 */
function runDiscard(ev: GameEvent, seat: PlayerId): void {
  if (ev.type !== 'cards-discarded') return
  const duration = scaled(DISCARD_STEP_MS)
  if (ev.player !== seat) {
    const link = document.querySelector<HTMLElement>(`[data-hand-of="${CSS.escape(ev.player)}"]`)
    if (!link) return
    glow(link, 'loss', 0, duration)
    floatText(link, `−${ev.objects.length} discarded`, 'loss', 0, duration * 1.6)
    return
  }
  for (const id of ev.objects) {
    const el = document.querySelector<HTMLElement>(`.hand-cards [data-obj-id="${CSS.escape(id)}"]`)
    if (!el) continue
    if (motionPrefs().reduced) {
      el.animate([{ opacity: 1 }, { opacity: 0 }], { duration, fill: 'forwards' })
      continue
    }
    const ghost = makeGhost(el)
    if (ghost === null) continue
    releaseWhenDone(
      ghost.box,
      ghost.box.animate(
        [
          { transform: 'translateY(0)', opacity: 1, filter: 'grayscale(0)' },
          { transform: 'translateY(-20%)', opacity: 1, filter: 'grayscale(0.8)', offset: 0.35 },
          { transform: 'translateY(-10%) scale(0.85)', opacity: 0, filter: 'grayscale(1) brightness(0.5)' },
        ],
        { duration, easing: 'ease-in', fill: 'forwards' },
      ),
    )
  }
}

/**
 * Moves across the board (a change of control, an Aura or Equipment going to
 * a new host, the monarch's crown) need both boards: where the thing was, on
 * the old one, and where it is, on the new. The frame's first half snapshots
 * the old spot the moment it starts (`captureMove`), as a hidden copy, keyed
 * by the event; the second half flies that copy onto the thing's new place
 * (`runMove`/`runCrown`). A snapshot nobody collects (the frame's second half
 * was dropped at its ceiling) removes itself.
 */
const captured = new Map<number, { box: HTMLElement; rect: DOMRect }>()

function captureMove(ev: GameEvent): void {
  let el: HTMLElement | null = null
  if (ev.type === 'control-changed') el = boardTileOf(ev.object)
  else if (ev.type === 'permanent-attached') el = boardTileOf(ev.source)
  else if (ev.type === 'monarch-changed') el = document.querySelector<HTMLElement>('.pp-monarch')
  if (!el || motionPrefs().reduced) return
  const rect = el.getBoundingClientRect()
  if (rect.width === 0) return
  const copy = el.cloneNode(true) as HTMLElement
  copy.removeAttribute('data-obj-id')
  const box = document.createElement('div')
  box.className = 'ghost-flight'
  const tile = el.querySelector<HTMLElement>('.mini-tile')
  if (tile) box.style.setProperty('--mini-w', `${tile.offsetWidth}px`)
  box.style.left = `${rect.left}px`
  box.style.top = `${rect.top}px`
  box.style.width = `${rect.width}px`
  box.style.height = `${rect.height}px`
  box.style.visibility = 'hidden'
  box.appendChild(copy)
  document.body.appendChild(box)
  captured.set(ev.seq, { box, rect })
  window.setTimeout(() => {
    if (captured.get(ev.seq)?.box === box) captured.delete(ev.seq)
    box.remove()
  }, 15_000)
}

/** Flies a captured copy from its old place onto `target`'s, holding the real
 * `target` hidden until it lands, then `after`. */
function flyCaptured(
  seq: number,
  target: HTMLElement,
  delay: number,
  duration: number,
  after?: () => void,
): boolean {
  const snap = captured.get(seq)
  captured.delete(seq)
  if (!snap) return false
  const to = target.getBoundingClientRect()
  const { box, rect: from } = snap
  box.style.visibility = 'visible'
  const dx = to.left + to.width / 2 - (from.left + from.width / 2)
  const dy = to.top + to.height / 2 - (from.top + from.height / 2)
  const flight = box.animate(
    [
      { transform: 'translate(0, 0) scale(1)', offset: 0 },
      { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 24}px) scale(1.1)`, offset: 0.5 },
      { transform: `translate(${dx}px, ${dy}px) scale(1)` },
    ],
    { duration, delay, easing: 'cubic-bezier(0.4, 0, 0.3, 1)', fill: 'both' },
  )
  target.animate([{ opacity: 0 }, { opacity: 0 }], { duration: delay + duration, fill: 'backwards' })
  flight.onfinish = () => {
    box.remove()
    after?.()
  }
  flight.oncancel = () => box.remove()
  return true
}

/**
 * A permanent that changed controller slides across to its new controller's
 * board; an Aura or Equipment that moved glides onto its new host, which then
 * glows. Without a snapshot (it wasn't on the old board: an Aura just cast,
 * a creature entering under someone else's control) it simply arrives.
 */
function runMove(ev: GameEvent, delay: number): void {
  const duration = scaled(MOVE_STEP_MS)
  if (ev.type === 'control-changed') {
    const tile = boardTileOf(ev.object)
    if (!tile) return
    if (!flyCaptured(ev.seq, tile, delay, duration)) runEnter(ev.object, false, delay)
    return
  }
  if (ev.type !== 'permanent-attached') return
  const attachment = boardTileOf(ev.source)
  const host = boardTileOf(ev.target)?.querySelector<HTMLElement>('.mini-tile')
  if (host) glow(host, 'info', delay + (attachment ? duration * 0.7 : 0), duration)
  if (attachment) flyCaptured(ev.seq, attachment, delay, duration)
}

/** The monarch's crown passing to its new holder: it flies from the old
 * holder's panel to the new one's, or pops in if nobody had it. */
function runCrown(ev: GameEvent, delay: number): void {
  if (ev.type !== 'monarch-changed') return
  const crown = document.querySelector<HTMLElement>(
    `[data-player-id="${CSS.escape(ev.player)}"] .pp-monarch`,
  )
  if (!crown) return
  const duration = scaled(CROWN_STEP_MS)
  if (flyCaptured(ev.seq, crown, delay, duration)) return
  crown.animate(
    motionPrefs().reduced
      ? [{ opacity: 0 }, { opacity: 1 }]
      : [{ scale: '0', opacity: 0 }, { scale: '1.6', opacity: 1, offset: 0.6 }, { scale: '1', opacity: 1 }],
    { duration, delay, easing: 'ease-out', fill: 'backwards' },
  )
}

/**
 * A permanent tilting to tapped, or back upright. Plays in a frame's second
 * half, over the board that already shows the tile in its new pose, so it
 * runs from the old pose to whatever the tile is wearing now. `fill:
 * 'backwards'` holds the old pose through `delay`, and the cue is started
 * before that board is painted (see `usePlayback`), so the new pose never
 * flashes up first.
 */
function runTap(object: ObjectId, tapped: boolean, delay: number): void {
  const tile = document.querySelector<HTMLElement>(
    `[data-obj-id="${CSS.escape(object)}"] .mini-tile`,
  )
  if (!tile) return
  const timing: KeyframeAnimationOptions = {
    duration: scaled(TAP_STEP_MS),
    delay,
    easing: 'cubic-bezier(0.3, 0, 0.3, 1)',
    fill: 'backwards',
  }
  tile.animate([{ transform: tapped ? 'none' : TAPPED_POSE }, {}], timing)
  if (!tapped) return
  // The dimming scrim darkens with the tilt rather than ahead of it. (An
  // untapped tile has no scrim left to fade out.)
  try {
    tile.animate([{ opacity: 0 }, {}], { ...timing, pseudoElement: '::before' })
  } catch {
    // A browser that can't animate a pseudo-element just shows the scrim.
  }
}

/**
 * Purely cosmetic overlays — a card zooming up when cast or played, an
 * attacker hitting whatever it deals combat damage to, a permanent fading as
 * it leaves the board, and Hearthstone-style turn/phase banners.
 *
 * Deliberately a sibling of `<Table>` in `GameScreen`, not something inside
 * it: `Table` remounts wholesale on every frame it's keyed on, which would
 * tear down every in-flight animation. Its cues come from the bus
 * `usePlayback` publishes to as it plays each frame, and each cue carries
 * the board it belongs to — so the card drawn here is the card as it looked
 * in that frame, not as it looks in whatever the server has pushed since.
 *
 * Every visual here is additive (a portalled overlay, or a `.animate()` call
 * on an existing node) — nothing here ever affects game state, and a missed
 * or double-played animation is harmless.
 */
export function AnimationLayer({
  bus,
  seat,
  seats,
}: {
  readonly bus: AnimationBus
  readonly seat: PlayerId
  readonly seats?: readonly SeatStatus[]
}) {
  const [reveals, setReveals] = useState<readonly Reveal[]>([])
  const [playedCards, setPlayedCards] = useState<readonly PlayedCard[]>([])
  const [drawnCards, setDrawnCards] = useState<readonly DrawnCard[]>([])
  const [activeBanner, setActiveBanner] = useState<Banner | null>(null)
  const bannerQueueRef = useRef<Banner[]>([])
  const bannerTimerRef = useRef<number | null>(null)

  // Read through refs, so the one subscription below survives every push
  // instead of being torn down and rebuilt (which would drop cues already
  // waiting on their own timers).
  const seatRef = useRef(seat)
  const seatsRef = useRef(seats)
  useEffect(() => {
    seatRef.current = seat
    seatsRef.current = seats
  }, [seat, seats])

  useEffect(
    () => () => {
      if (bannerTimerRef.current !== null) window.clearTimeout(bannerTimerRef.current)
    },
    [],
  )

  useEffect(() => {
    const advanceBannerQueue = () => {
      if (bannerTimerRef.current !== null) return
      const next = bannerQueueRef.current.shift()
      if (!next) return
      setActiveBanner(next)
      bannerTimerRef.current = window.setTimeout(
        () => {
          setActiveBanner(null)
          bannerTimerRef.current = null
          advanceBannerQueue()
        },
        scaled(next.kind === 'turn' ? TURN_BANNER_DURATION_MS : PHASE_BANNER_DURATION_MS),
      )
    }
    const enqueueBanner = (b: Banner) => {
      bannerQueueRef.current.push(b)
      // Banners are captions: they hold nothing up (see animationSchedule's
      // PACED), which means the game can outrun this queue. Keep only the
      // most recent few, so a backlog gets dropped rather than narrating a
      // turn that finished several turns ago.
      if (bannerQueueRef.current.length > MAX_QUEUED_BANNERS) {
        bannerQueueRef.current.splice(0, bannerQueueRef.current.length - MAX_QUEUED_BANNERS)
      }
      advanceBannerQueue()
    }

    const fire = (cue: AnimationCue): void => {
      const { event: ev, view } = cue
      soundFor(ev)
      if (ev.type === 'spell-cast' || ev.type === 'land-played') {
        const obj = view.objects[ev.object]
        if (!obj) return
        const key = `card-${ev.seq}`
        const origin = handOrigin(ev.object) ?? flyOrigin(ev.player, seatRef.current)
        const who = playerLabel(ev.player, seatsRef.current)
        const verb = ev.type === 'land-played' ? 'plays' : 'casts'
        // Where it came from, when that isn't the hand: flashback, a
        // commander, an impulse draw are worth saying.
        const from = FROM_ZONE[ev.from] ?? ''
        const caption = `${who} ${verb}${from ? ` ${from}` : ''}`
        const seatClass = seatClassOf(view.turnOrder, ev.player)
        setPlayedCards((cur) => [
          ...cur,
          { key, obj, originX: origin.x, originY: origin.y, caption, seatClass },
        ])
        window.setTimeout(() => {
          setPlayedCards((cur) => cur.filter((c) => c.key !== key))
        }, scaled(PLAYED_CARD_DURATION_MS))
      } else if (ev.type === 'damage-dealt' && ev.combat) {
        runHit(ev.source, ev.target)
      } else if (
        ev.type === 'spell-resolved' ||
        ev.type === 'ability-resolved' ||
        ev.type === 'spell-countered' ||
        ev.type === 'spell-fizzled'
      ) {
        runStackExit(ev, view, seatRef.current)
      } else if (ev.type === 'permanent-left-battlefield') {
        if (ev.toZone === 'hand') runBounce(ev.object, cue.prev)
        else runDeath(ev.object, ev.toZone)
      } else if (ev.type === 'cards-milled' || ev.type === 'cards-put-into-exile') {
        runMill(ev, view, cue.prev)
      } else if (ev.type === 'cards-discarded') {
        runDiscard(ev, seatRef.current)
      } else if (ev.type === 'cards-revealed') {
        const cards = ev.objects
          .map((id) => view.objects[id])
          .filter((o): o is VisibleObject => o !== undefined)
        if (cards.length === 0) return
        const key = `reveal-${ev.seq}`
        const who = playerLabel(ev.player, seatsRef.current)
        setReveals((cur) => [
          ...cur,
          { key, caption: `${who} reveals from their ${ev.from}`, cards },
        ])
        window.setTimeout(() => {
          setReveals((cur) => cur.filter((r) => r.key !== key))
        }, scaled(REVEAL_STEP_MS))
      } else if (ev.type === 'card-drawn') {
        const flight = drawFlight(ev.player)
        if (!flight) return
        const key = `draw-${ev.seq}`
        setDrawnCards((cur) => [...cur, { key, ...flight }])
        window.setTimeout(() => {
          setDrawnCards((cur) => cur.filter((c) => c.key !== key))
        }, scaled(DRAWN_CARD_DURATION_MS))
      } else if (ev.type === 'turn-began') {
        enqueueBanner({
          key: `turn-${ev.seq}`,
          kind: 'turn',
          text: `${playerLabel(ev.activePlayer, seatsRef.current)}'s Turn${ev.extra ? ' (extra)' : ''}`,
          seatClass: seatClassOf(view.turnOrder, ev.activePlayer),
        })
      } else if (ev.type === 'step-began') {
        const text = PHASE_LABEL[ev.phase]
        if (!text) return
        enqueueBanner({ key: `phase-${ev.seq}`, kind: 'phase', text, seatClass: null })
      }
    }

    return bus.subscribe((cues) => {
      // Arrivals are gathered and played per tile after the loop (`runEnters`).
      const enters: { object: ObjectId; isToken: boolean; delay: number }[] = []
      for (const cue of cues) {
        if (cue.half === 'after') {
          // Started now, in the task that mounted the new board, with the
          // wait handed to the animation itself: a timer would let that board
          // paint once in its final pose before the animation took it back.
          if (cue.event.type === 'permanent-tapped') runTap(cue.event.object, true, cue.delay)
          else if (cue.event.type === 'permanent-untapped') {
            runTap(cue.event.object, false, cue.delay)
          } else if (cue.event.type === 'ability-triggered') runPulse(cue.event.source, cue.delay)
          else if (cue.event.type === 'permanent-entered-battlefield') {
            const object = cue.event.object
            // One sound per tile, as one animation: a folded member is silent.
            const tile = boardTileOf(object)
            const folded = tile !== null && enters.some((e) => boardTileOf(e.object) === tile)
            enters.push({ object, isToken: cue.view.objects[object]?.isToken ?? false, delay: cue.delay })
            if (folded) continue
          } else if (
            cue.event.type === 'counter-added' ||
            cue.event.type === 'pt-modified' ||
            cue.event.type === 'keyword-granted'
          ) {
            runMark(cue.event, cue.delay)
          } else if (cue.event.type === 'permanent-transformed') runFlip(cue.event.object, cue.delay)
          else if (cue.event.type === 'control-changed' || cue.event.type === 'permanent-attached') {
            runMove(cue.event, cue.delay)
          } else if (cue.event.type === 'monarch-changed') runCrown(cue.event, cue.delay)
          else if (cue.event.type === 'life-changed' || cue.event.type === 'damage-dealt') {
            runHurt(cue.event, cue.delay)
          }
          const ev = cue.event
          window.setTimeout(() => soundFor(ev), cue.delay)
          continue
        }
        // A move's snapshot is of the board as the frame starts, so it's taken
        // now rather than at its slot.
        if (
          cue.event.type === 'control-changed' ||
          cue.event.type === 'permanent-attached' ||
          cue.event.type === 'monarch-changed'
        ) {
          captureMove(cue.event)
          continue
        }
        window.setTimeout(() => fire(cue), cue.delay)
      }
      runEnters(enters)
    })
  }, [bus])

  if (
    playedCards.length === 0 &&
    drawnCards.length === 0 &&
    reveals.length === 0 &&
    !activeBanner
  ) {
    return null
  }

  return createPortal(
    <div className="anim-layer">
      {playedCards.map((c) => (
        <div
          key={c.key}
          className="played-card-fly"
          style={
            { '--fly-x': `${c.originX}px`, '--fly-y': `${c.originY}px` } as CSSProperties
          }
        >
          <div className={`played-card-caption ${c.seatClass ?? ''}`}>{c.caption}</div>
          <CardTile obj={c.obj} layout="art-first" />
        </div>
      ))}
      {drawnCards.map((c) => (
        <div
          key={c.key}
          className="drawn-card-fly"
          style={
            {
              '--draw-from-x': `${c.fromX}px`,
              '--draw-from-y': `${c.fromY}px`,
              '--draw-to-x': `${c.toX}px`,
              '--draw-to-y': `${c.toY}px`,
            } as CSSProperties
          }
        >
          <div className="card-back" />
        </div>
      ))}
      {reveals.map((r) => (
        <div key={r.key} className="reveal-show">
          <div className="reveal-caption">{r.caption}</div>
          <div className="reveal-cards">
            {r.cards.map((obj) => (
              <CardTile key={obj.id} obj={obj} layout="art-first" />
            ))}
          </div>
        </div>
      ))}
      {activeBanner ? (
        <div
          key={activeBanner.key}
          className={`tp-banner tp-${activeBanner.kind} ${activeBanner.seatClass ?? ''}`}
        >
          {activeBanner.text}
        </div>
      ) : null}
    </div>,
    document.body,
  )
}
