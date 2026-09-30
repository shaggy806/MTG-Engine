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
  PHASE_STEP_MS,
  REVEAL_STEP_MS,
  TAP_STEP_MS,
  TURN_STEP_MS,
} from '../game/animationSchedule.ts'
import type { AnimationBus } from '../game/animationBus.ts'
import { motionPrefs } from '../game/motionPrefs.ts'

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
 * Fades a permanent off the board as it leaves, whatever the destination —
 * dying, sacrificed, bounced, exiled. Runs while the board on screen is
 * still the one that has it (see usePlayback), and the frame it belongs to
 * holds that board for `DEATH_STEP_MS`, so the tile is gone by the time the
 * fade finishes rather than blinking out of existence unannounced.
 */
function runDeath(object: ObjectId): void {
  const el = elementFor({ kind: 'object', object })
  if (!el) return // never drawn (entered and left inside one frame)
  if (motionPrefs().reduced) {
    el.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: scaled(DEATH_DURATION_MS),
      fill: 'forwards',
    })
    return
  }
  const base = srcBaseTransform(el)
  el.animate(
    [
      { opacity: 1, filter: 'grayscale(0)', transform: `scale(1) ${base}`, offset: 0 },
      {
        opacity: 0.85,
        filter: 'grayscale(0.6) brightness(1.3)',
        transform: `scale(1.06) ${base}`,
        offset: 0.25,
      },
      {
        opacity: 0,
        filter: 'grayscale(1) brightness(0.6)',
        transform: `scale(0.72) ${base}`,
        offset: 1,
      },
    ],
    { duration: scaled(DEATH_DURATION_MS), easing: 'ease-in', fill: 'forwards' },
  )
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
  const r = el.getBoundingClientRect()
  if (r.width === 0 && r.height === 0) return
  const tile = el.querySelector<HTMLElement>('.mini-tile') ?? el
  const ghost = el.cloneNode(true) as HTMLElement
  ghost.removeAttribute('data-obj-id')
  const box = document.createElement('div')
  box.className = 'ghost-flight'
  box.style.setProperty('--mini-w', `${tile.offsetWidth}px`)
  box.style.left = `${r.left}px`
  box.style.top = `${r.top}px`
  box.style.width = `${r.width}px`
  box.style.height = `${r.height}px`
  box.appendChild(ghost)
  document.body.appendChild(box)
  el.style.visibility = 'hidden'

  const dx = to.x - (r.left + r.width / 2 - window.innerWidth / 2)
  const dy = to.y - (r.top + r.height / 2 - window.innerHeight / 2)
  const flight = box.animate(
    [
      { transform: 'translate(0, 0) scale(1)', opacity: 1 },
      { transform: `translate(${dx * 0.15}px, ${dy * 0.15}px) scale(1.08)`, opacity: 1, offset: 0.2 },
      { transform: `translate(${dx}px, ${dy}px) scale(0.55)`, opacity: 0 },
    ],
    { duration, easing: 'cubic-bezier(0.3, 0, 0.35, 1)', fill: 'forwards' },
  )
  flight.onfinish = () => box.remove()
  flight.oncancel = () => box.remove()
}

/**
 * A permanent returned to its hand flies there — the draw flight run in
 * reverse. It heads for the hand of the board it was on, which is its
 * controller's: a stolen creature bounced back to its owner goes the wrong
 * way, which is a rare enough case to leave until control changes get their
 * own animation. Falls back to the ordinary fade where there's nothing to fly
 * (the tile or its cell can't be found) or motion is reduced.
 */
function runBounce(object: ObjectId): void {
  const el = elementFor({ kind: 'object', object })
  const cell = el?.closest<HTMLElement>('.quadrant-cell')
  if (!el || !cell || motionPrefs().reduced) {
    runDeath(object)
    return
  }
  flyGhost(el, handPoint(cell), scaled(DEATH_DURATION_MS))
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

    const fire = (ev: GameEvent, view: PlayerView): void => {
      if (ev.type === 'spell-cast' || ev.type === 'land-played') {
        const obj = view.objects[ev.object]
        if (!obj) return
        const key = `card-${ev.seq}`
        const origin = handOrigin(ev.object) ?? flyOrigin(ev.player, seatRef.current)
        setPlayedCards((cur) => [...cur, { key, obj, originX: origin.x, originY: origin.y }])
        window.setTimeout(() => {
          setPlayedCards((cur) => cur.filter((c) => c.key !== key))
        }, scaled(PLAYED_CARD_DURATION_MS))
      } else if (ev.type === 'damage-dealt' && ev.combat) {
        runHit(ev.source, ev.target)
      } else if (ev.type === 'permanent-left-battlefield') {
        if (ev.toZone === 'hand') runBounce(ev.object)
        else runDeath(ev.object)
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
      for (const cue of cues) {
        if (cue.half === 'after') {
          // Started now, in the task that mounted the new board, with the
          // wait handed to the animation itself: a timer would let that board
          // paint once in its final pose before the animation took it back.
          if (cue.event.type === 'permanent-tapped') runTap(cue.event.object, true, cue.delay)
          else if (cue.event.type === 'permanent-untapped') {
            runTap(cue.event.object, false, cue.delay)
          }
          continue
        }
        window.setTimeout(() => fire(cue.event, cue.view), cue.delay)
      }
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
